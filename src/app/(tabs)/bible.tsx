import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";

// import * as Clipboard from "expo-clipboard";

import { BottomSheetModal, BottomSheetSectionList } from "@gorhom/bottom-sheet";

import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react-native";

import { isRedLetterVerse } from "@/constants/red-text";
import { useTheme } from "@/context/theme-context";
import SelectionActionBar from "@/components/bible/SelectionActionBar";
import SaveVerseSheet, {
  SaveVerseSheetHandle,
} from "@/components/bible/SaveVerseSheet";
import VersionSheet, { VersionSheetHandle } from "@/components/bible/VersionSheet";
import VerseText from "@/components/bible/VerseText";
import { useToast } from "@/components/Toast";
import { cleanVerseText } from "@/libs/bible/verse-annotations";
import { ensureBibleSeeded } from "@/libs/sqlite/bible";
import { sqlite } from "@/libs/sqlite/db";
import {
  getSavedIds,
  getSavedVerse,
  saveVerses,
  unsaveVerses,
} from "@/libs/sqlite/saved-verses";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  RotateInUpRight,
  SlideInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------------------------- PURE ROW ---------------------------- */

const VerseRow = memo(
  ({ item, index, selected, onToggle, highlighted }: any) => {
    const isRed = isRedLetterVerse(item.book, item.chapter, item.verse);
    const isHighlighted = highlighted === item.verse;

    return (
      <Pressable
        onPress={() => onToggle(item.id)}
        className={`flex-row items-start mb-6 p-2 rounded-lg ${
          isHighlighted ? "bg-amber-500/20" : ""
        }`}
      >
        <Text className="text-muted text-xs font-sora-semibold mt-1 w-6">
          {index + 1}
        </Text>

        <VerseText
          text={item.text}
          colorClass={
            selected
              ? "text-amber-500"
              : isRed
                ? "text-red-500"
                : "text-primary"
          }
          containerClassName="flex-1"
        />
      </Pressable>
    );
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.item.id === next.item.id &&
    prev.item.text === next.item.text,
);

/* ---------------------------- MAIN ---------------------------- */

export default function Bible() {
  const { top } = useSafeAreaInsets();
  const version = "KJV"
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
  }>();

  const [loading, setLoading] = useState(true);

  const [books, setBooks] = useState<any[]>([]);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<any[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<Record<string, boolean>>(
    {},
  );
  const flatListRef = useRef<FlatList>(null);

  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(1);

  const [search, setSearch] = useState("");
  // Verse ids the reader has saved / highlighted (offline-persisted).
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const refreshSaved = async () => {
    try {
      setSavedIds(await getSavedIds());
    } catch {
      /* ignore – save actions also refresh defensively */
    }
  };
  useEffect(() => {
    void refreshSaved();
  }, []);
  // Bottom sheet driving the "Books of the Bible" navigation chooser.
  const bookSheetRef = useRef<BottomSheetModal>(null);
  const bookSheetSnapPoints = useMemo(() => ["85%", "95%"], []);
  const saveSheetRef = useRef<SaveVerseSheetHandle>(null);
  const versionSheetRef = useRef<VersionSheetHandle>(null);

  const toggleVerse = useCallback((id: string) => {
    setSelectedVerses((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

  const [expandedBook, setExpandedBook] = useState<number | null>(null);

  /* ---------------------------- CACHE (IMPORTANT OPTIMIZATION) ---------------------------- */

  const verseCache = useRef(new Map<string, any[]>());

  /* ---------------------------- NAVIGATE TO BOOK ---------------------------- */

  const navigateToBook = useCallback(
    async (bookName: string, chapterNum: number, verseNum?: number) => {
      const normalizeBook = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]/g, "");

      const target = normalizeBook(bookName);
      const found = books.find((b: any) => normalizeBook(b.book) === target);

      if (found) {
        await goToChapter(found.bookIndex, chapterNum, verseNum);
      }
    },
    [books],
  );

  const scrollToVerse = useCallback(
    (verseNumber: number) => {
      if (!verses.length || !flatListRef.current) return;

      // Find the index of the verse
      const index = verses.findIndex((v) => v.verse === verseNumber);

      if (index === -1) {
        console.warn(`Verse ${verseNumber} not found in current chapter`);
        return;
      }

      // Set highlight
      setHighlightedVerse(verseNumber);

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedVerse(null);
      }, 3000);

      // Scroll to the verse with some offset for better visibility
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.2, // Positions the verse about 20% from the top
      });
    },
    [verses],
  );

  /* ---------------------------- INIT ---------------------------- */

  useEffect(() => {
    bootstrap();
  }, []);

  // Handle navigation params after books are loaded
  useEffect(() => {
    if (!loading && books.length > 0 && params.book && params.chapter) {
      const verseNum = params.verse ? parseInt(params.verse, 10) : undefined;
      navigateToBook(params.book, parseInt(params.chapter, 10), verseNum);
    }
  }, [
    loading,
    books,
    params.book,
    params.chapter,
    params.verse,
    navigateToBook,
  ]);

  const bootstrap = async () => {
    try {
      setLoading(true);

      await ensureBibleSeeded();

      await loadBooks();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && verses.length > 0 && params.verse) {
      const verseNum = parseInt(params.verse, 10);
      if (!isNaN(verseNum)) {
        // Small delay to ensure FlatList is rendered
        setTimeout(() => {
          scrollToVerse(verseNum);
        }, 300);
      }
    }
  }, [loading, verses, params.verse, scrollToVerse]);

  /* ---------------------------- LOAD BOOKS ---------------------------- */

  const loadBooks = async () => {
    const res: any = await sqlite.getAllAsync(
      `SELECT DISTINCT book, bookIndex
       FROM bible_verses
       ORDER BY bookIndex ASC`,
    );

    setBooks(res);

    if (res.length) {
      const first = res[0].bookIndex;
      setSelectedBookIndex(first);

      await loadChapters(first);
      await loadVerses(first, 1);
    }
  };

  /* ---------------------------- LOAD CHAPTERS ---------------------------- */

  const loadChapters = async (bookIndex: number) => {
    const res = await sqlite.getAllAsync(
      `SELECT DISTINCT chapter
       FROM bible_verses
       WHERE bookIndex = ?
       ORDER BY chapter ASC`,
      [bookIndex],
    );

    setChapters(res.map((r: any) => r.chapter));
  };

  /* ---------------------------- LOAD VERSES (WITH CACHE) ---------------------------- */

  const loadVerses = async (bookIndex: number, chapter: number) => {
    const key = `${bookIndex}-${chapter}`;

    if (verseCache.current.has(key)) {
      setVerses(verseCache.current.get(key)!);
      return;
    }

    const res = await sqlite.getAllAsync(
      `SELECT * FROM bible_verses
       WHERE bookIndex = ? AND chapter = ?
       ORDER BY verse ASC`,
      [bookIndex, chapter],
    );

    verseCache.current.set(key, res);
    setVerses(res);
  };

  const goToChapter = async (
    bookIndex: number,
    chapter: number,
    verse?: number,
  ) => {
    setSelectedBookIndex(bookIndex);
    setSelectedChapter(chapter);

    await loadChapters(bookIndex);
    await loadVerses(bookIndex, chapter);

    // If verse is provided, scroll to it after verses load
    if (verse) {
      setTimeout(() => {
        scrollToVerse(verse);
      }, 100);
    }
  };
  const goNext = async () => {
    const currentBook = books.find((b) => b.bookIndex === selectedBookIndex);

    if (!currentBook) return;

    const maxChapter = chapters[chapters.length - 1];

    // CASE 1: still chapters in same book
    if (selectedChapter < maxChapter) {
      await goToChapter(selectedBookIndex, selectedChapter + 1);
      return;
    }

    // CASE 2: move to next book
    const nextBook = books.find((b) => b.bookIndex === selectedBookIndex + 1);

    if (nextBook) {
      await goToChapter(nextBook.bookIndex, 1);
    }
  };

  const goPrev = async () => {
    // CASE 1: still inside same book
    if (selectedChapter > 1) {
      await goToChapter(selectedBookIndex, selectedChapter - 1);
      return;
    }

    // CASE 2: go to previous book
    const prevBook = books.find((b) => b.bookIndex === selectedBookIndex - 1);

    if (prevBook) {
      // get last chapter of previous book
      const res: any = await sqlite.getFirstAsync(
        `SELECT MAX(chapter) as maxChapter
       FROM bible_verses
       WHERE bookIndex = ?`,
        [prevBook.bookIndex],
      );

      const lastChapter = res?.maxChapter ?? 1;

      await goToChapter(prevBook.bookIndex, lastChapter);
    }
  };

  /* ---------------------------- ACTIONS ---------------------------- */

  const selectBook = useCallback(async (bookIndex: number) => {
    setSelectedBookIndex(bookIndex);
    setSelectedChapter(1);
    bookSheetRef.current?.dismiss();

    await loadChapters(bookIndex);
    await loadVerses(bookIndex, 1);
  }, []);

  const selectChapter = useCallback(
    async (ch: number) => {
      setSelectedChapter(ch);
      bookSheetRef.current?.dismiss();
      await loadVerses(selectedBookIndex, ch);
    },
    [selectedBookIndex],
  );

  /* ---------------------------- SELECTION ACTIONS ---------------------------- */

  // Build a clean shareable representation of the currently selected verses.
  const getSelection = () => {
    const items = verses.filter((v) => selectedVerses[v.id]);
    if (!items.length) return null;

    const numbers = items.map((v) => v.verse);
    const start = Math.min(...numbers);
    const end = Math.max(...numbers);
    const range = start === end ? `${start}` : `${start}-${end}`;
    const book =
      books.find((b) => b.bookIndex === selectedBookIndex)?.book ?? "";

    return {
      items,
      reference: `${book} ${selectedChapter}:${range}`,
      text: items.map((v) => cleanVerseText(v.text)).join(" "),
    };
  };

  const copySelection = async () => {
    const sel = getSelection();
    if (!sel) return;

    try {
      // const ok = await Clipboard.setStringAsync(
      //   `“${sel.text}”\n\n— ${sel.reference} (KJV)`,
      // );
      // showToast(ok ? "Verse copied" : "Couldn’t copy", ok ? "success" : "error");
    } catch {
      showToast("Couldn’t copy", "error");
    }
  };

  const shareSelection = () => {
    const sel = getSelection();
    if (!sel) return;

    try {
      void Share.share({
        message: `“${sel.text}”\n\n— ${sel.reference} (KJV)`,
        title: sel.reference,
      });
    } catch {
      showToast("Share unavailable", "error");
    }
  };

  const postSelection = () => {
    const sel = getSelection();
    if (!sel) return;

    router.push({
      pathname: "/(network)/sharethought",
      params: {
        verses: JSON.stringify(sel.items),
      },
    });
  };

  const toggleSaveSelection = async () => {
    const sel = getSelection();
    if (!sel) return;

    const ids = sel.items.map((v) => v.id);
    const alreadySaved = ids.every((id) => savedIds.has(id));

    // Pre-fill note + color when editing an already-saved verse.
    let existingNote: string | undefined;
    let existingColor: string | null | undefined;
    if (alreadySaved && ids.length) {
      const first = await getSavedVerse(ids[0]);
      existingNote = first?.note ?? undefined;
      existingColor = first?.color ?? undefined;
    }

    saveSheetRef.current?.present({
      reference: sel.reference,
      alreadySaved,
      note: existingNote,
      color: existingColor,
    });
  };

  const handleSaveVerse = (note: string, color: string | null) => {
    const sel = getSelection();
    if (!sel) return;

    void saveVerses(
      sel.items.map((v) => ({
        id: v.id,
        book: v.book,
        bookIndex: v.bookIndex,
        chapter: v.chapter,
        verse: v.verse,
        note,
        color,
      })),
    );
    showToast(note ? "Verse saved with note" : "Verse saved", "success");
    void refreshSaved();
  };

  const handleRemoveSaved = () => {
    const sel = getSelection();
    if (!sel) return;

    const ids = sel.items.map((v) => v.id);
    void unsaveVerses(ids);
    showToast("Removed from saved", "info");
    void refreshSaved();
  };

  const allSelectedSaved = useMemo(() => {
    const ids = verses
      .filter((v) => selectedVerses[v.id])
      .map((v) => v.id);
    return ids.length > 0 && ids.every((id) => savedIds.has(id));
  }, [verses, selectedVerses, savedIds]);

  /* ---------------------------- FILTER (MEMOIZED) ---------------------------- */

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;

    const lower = search.toLowerCase();

    return books.filter((b) => b.book.toLowerCase().includes(lower));
  }, [search, books]);

  // Books grouped by Old / New Testament for the picker bottom sheet.
  const bookSections = useMemo(() => {
    const ot = filteredBooks.filter((b: any) => b.bookIndex < 40);
    const nt = filteredBooks.filter((b: any) => b.bookIndex >= 40);
    return [
      { title: "Old Testament", data: ot },
      { title: "New Testament", data: nt },
    ].filter((s) => s.data.length > 0);
  }, [filteredBooks]);

  /* ---------------------------- RENDER ITEM (STABLE) ---------------------------- */

  const renderVerse = useCallback(
    ({ item, index }: any) => {
      return (
        <VerseRow
          item={item}
          index={index}
          selected={!!selectedVerses[item.id]}
          onToggle={toggleVerse}
        />
      );
    },
    [selectedVerses],
  );

  const renderBook = useCallback(
    ({ item }: any) => {
      const isSelected = selectedBookIndex === item.bookIndex;
      return (
        <View className="mb-3 ">
          <Pressable
            onPress={() => {
              // selectBook(item.bookIndex);
              setExpandedBook((prev) =>
                prev === item.bookIndex ? null : item.bookIndex,
              );
            }}
            className={` py-1 flex-row items-center justify-between`}
          >
            <View className="flex-row items-center flex-1">
              <Text
                className={`font-sora-semibold ${
                  isSelected ? "text-amber-500" : "text-primary"
                }`}
              >
                {item.book}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setExpandedBook((prev) =>
                  prev === item.bookIndex ? null : item.bookIndex,
                )
              }
              className="p-1"
            >
              {expandedBook === item.bookIndex ? (
                <Animated.View entering={RotateInUpRight}>
                  <ChevronDown color={isDark ? "#fff" : "#0c0c0c"} size={16} />
                </Animated.View>
              ) : (
                <ChevronRight color={isDark ? "#fff" : "#0c0c0c"} size={16} />
              )}
            </Pressable>
          </Pressable>

          {expandedBook === item.bookIndex ? (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="pb-4 flex-row flex-wrap"
            >
              {chapters.map((ch) => (
                <Pressable
                  key={ch}
                  onPress={() => {
                    selectBook(item.bookIndex);
                    selectChapter(ch);
                  }}
                  className="w-13 h-13 bg-bg m-1 rounded-xl items-center justify-center"
                >
                  <Text className="text-primary text-xs">{ch}</Text>
                </Pressable>
              ))}
            </Animated.View>
          ) : null}
        </View>
      );
    },
    [
      expandedBook,
      chapters,
      selectBook,
      selectChapter,
      selectedBookIndex,
      isDark,
    ],
  );

  /* ---------------------------- LOADING ---------------------------- */

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={isDark ? "#fff" : "#0c0c0c"} />
        <Text className="text-primary mt-4">Loading Bible...</Text>
      </View>
    );
  }

  /* ---------------------------- UI ---------------------------- */

  return (
    <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
      {/* HEADER */}
      <View className="px-5 pb-3 flex-row justify-between items-center">
        <Pressable
          onPress={goPrev}
          className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center"
        >
          <ChevronLeft color={isDark ? "#fff" : "#0c0c0c"} size={18} />
        </Pressable>

        <View className="flex-row gap-1">
          <Pressable
            onPress={() => versionSheetRef.current?.present()}
            className="bg-card-2 px-3 py-2 rounded-l-xl"
          >
            <Text className="text-tertiary text-xs font-sora-semibold">{version}</Text>
          </Pressable>
          <Pressable
            onPress={() => bookSheetRef.current?.present()}
            className="bg-card-2 px-3 py-2 rounded-r-xl"
          >
            <Text className="text-primary text-sm font-sora-semibold">
              {books.find((b) => b.bookIndex === selectedBookIndex)?.book ??
                "Bible"}{" "}
              <Text className="text-secondary">{selectedChapter}</Text>
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/saved")}
          className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center mr-2"
        >
          <Bookmark color="#fbbf24" size={17} />
        </Pressable>

        <Pressable
          onPress={goNext}
          className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center"
        >
          <ChevronRight color={isDark ? "#fff" : "#0c0c0c"} size={18} />
        </Pressable>
      </View>

      {Object.keys(selectedVerses).length !== 0 && (
        <SelectionActionBar
          isDark={isDark}
          count={Object.keys(selectedVerses).length}
          allSaved={allSelectedSaved}
          onCopy={copySelection}
          onShare={shareSelection}
          onPost={postSelection}
          onToggleSave={toggleSaveSelection}
        />
      )}

      {/* VERSES */}
      <FlatList
        data={verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item.id}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        windowSize={7}
        initialNumToRender={10}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Text className="text-secondary text-sm font-sora">
              Select a book and chapter to begin reading
            </Text>
          </View>
        }
      />

      {/* BOTTOM SHEET — Book picker navigation */}
      <BottomSheetModal
        ref={bookSheetRef}
        index={0}
        snapPoints={bookSheetSnapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fff" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#f5f5ed",
          width: 42,
        }}
      >
        <BottomSheetSectionList
          ListHeaderComponent={() => (
            <>
              {/* Header */}
              <View className="flex-row items-center justify-between  pt-2 pb-3">
                <View>
                  <Text className="text-primary text-base font-sora-bold">
                    Books of the Bible
                  </Text>
                  <Text className="text-tertiary text-[11px] font-sora">
                    Tap a book to read, expand for chapters
                  </Text>
                </View>
                <Pressable
                  onPress={() => bookSheetRef.current?.dismiss()}
                  className="w-9 h-9 bg-card-2 rounded-xl items-center justify-center"
                >
                  <X color={isDark ? "#fff" : "#0c0c0c"} size={18} />
                </Pressable>
              </View>

              {/* SEARCH */}
              <View className=" py-3 border-b border-line">
                <View className="flex-row items-center bg-card-2 px-3 py-2.5 rounded-xl">
                  <Search color={isDark ? "#9ca3af" : "#71717a"} size={15} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search book..."
                    placeholderTextColor={isDark ? "#555" : "#9ca3af"}
                    className="flex-1 text-primary/80 text-xs ml-2.5 font-sora"
                  />
                </View>
              </View>
            </>
          )}
          nestedScrollEnabled
          sections={bookSections}
          keyExtractor={(i: any) => i.bookIndex.toString()}
          renderItem={renderBook}
          renderSectionHeader={({ section }) => (
            <Text className=" pt-4 pb-1 text-secondary text-[11px] font-sora-semibold">
              {section.title}
            </Text>
          )}
          stickySectionHeadersEnabled={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={6}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheetModal>

      {/* Save verse (note + color tag) */}
      <SaveVerseSheet
        ref={saveSheetRef}
        onSave={handleSaveVerse}
        onRemove={handleRemoveSaved}
      />

      {/* Bible version picker */}
      <VersionSheet ref={versionSheetRef} />
    </View>
  );
}
