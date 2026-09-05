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
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react-native";

import { isRedLetterVerse } from "@/constants/red-text";
import { ensureBibleSeeded } from "@/libs/sqlite/bible";
import { sqlite } from "@/libs/sqlite/db";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme-context";

/* ---------------------------- TYPES ---------------------------- */

export type BibleVerse = {
  id: string;
  book: string;
  bookIndex: number;
  chapter: number;
  verse: number;
  text: string;
};

export type BibleSelection = {
  verses: BibleVerse[];
  reference: string;
  text: string;
};

type BibleModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (selection: BibleSelection) => void;
  selectionMode?: boolean;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
};

/* ---------------------------- PURE ROW ---------------------------- */

const VerseRow = memo(
  ({
    item,
    index,
    selected,
    onToggle,
    highlighted,
    selectionMode,
  }: {
    item: BibleVerse;
    index: number;
    selected: boolean;
    onToggle: (id: string) => void;
    highlighted: number | null;
    selectionMode: boolean;
  }) => {
    const isRed = isRedLetterVerse(item.book, item.chapter, item.verse);
    const isHighlighted = highlighted === item.verse;

    return (
      <Pressable
        onPress={() => selectionMode && onToggle(item.id)}
        className={`flex-row items-start mb-6 p-2 rounded-lg ${
          isHighlighted ? "bg-amber-500/20" : ""
        }`}
      >
        <Text className="text-muted text-xs font-sora-semibold mt-1 w-6">
          {index + 1}
        </Text>

        <Text
          className={`flex-1 text-base leading-8 font-serif ${
            selected
              ? "text-amber-500"
              : isRed
                ? "text-red-500"
                : "text-primary"
          }`}
        >
          {item.text}
        </Text>

        {selectionMode && (
          <View
            className={`ml-2 w-5 h-5 rounded-full border-2 items-center justify-center mt-1 ${
              selected ? "border-amber-400 bg-amber-400/20" : "border-line"
            }`}
          >
            {selected && <View className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
          </View>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.item.id === next.item.id &&
    prev.item.text === next.item.text &&
    prev.highlighted === next.highlighted &&
    prev.selectionMode === next.selectionMode,
);

/* ---------------------------- MAIN MODAL ---------------------------- */

export default function BibleModal({
  visible,
  onClose,
  onSelect,
  selectionMode = false,
  initialBook,
  initialChapter,
  initialVerse,
}: BibleModalProps) {
  const { top } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  const [books, setBooks] = useState<any[]>([]);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<
    Record<string, boolean>
  >({});
  const flatListRef = useRef<FlatList>(null);

  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(1);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const toggleVerse = useCallback((id: string) => {
    setSelectedVerses((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

  const [expandedBook, setExpandedBook] = useState<number | null>(null);

  /* ---------------------------- CACHE ---------------------------- */

  const verseCache = useRef(new Map<string, BibleVerse[]>());

  /* ---------------------------- SCROLL TO VERSE ---------------------------- */

  const scrollToVerse = useCallback(
    (verseNumber: number) => {
      if (!verses.length || !flatListRef.current) return;

      const index = verses.findIndex((v) => v.verse === verseNumber);

      if (index === -1) {
        console.warn(`Verse ${verseNumber} not found in current chapter`);
        return;
      }

      setHighlightedVerse(verseNumber);

      setTimeout(() => {
        setHighlightedVerse(null);
      }, 3000);

      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.2,
      });
    },
    [verses],
  );

  /* ---------------------------- INIT ---------------------------- */

  useEffect(() => {
    if (visible) {
      bootstrap();
    }
  }, [visible]);

  // Navigate to initial book/chapter/verse when modal opens and data loads
  useEffect(() => {
    if (
      visible &&
      !loading &&
      books.length > 0 &&
      initialBook &&
      initialChapter
    ) {
      const normalizeBook = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]/g, "");

      const target = normalizeBook(initialBook);
      const found = books.find(
        (b: any) => normalizeBook(b.book) === target,
      );

      if (found) {
        goToChapter(found.bookIndex, initialChapter, initialVerse);
      }
    }
  }, [visible, loading, books]);

  const bootstrap = async () => {
    try {
      setLoading(true);

      await ensureBibleSeeded();

      await loadBooks();
    } finally {
      setLoading(false);
    }
  };

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

    const res = await sqlite.getAllAsync<BibleVerse>(
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

    if (verse) {
      setTimeout(() => {
        scrollToVerse(verse);
      }, 100);
    }
  };

  const goNext = async () => {
    const currentBook = books.find(
      (b) => b.bookIndex === selectedBookIndex,
    );

    if (!currentBook) return;

    const maxChapter = chapters[chapters.length - 1];

    if (selectedChapter < maxChapter) {
      await goToChapter(selectedBookIndex, selectedChapter + 1);
      return;
    }

    const nextBook = books.find(
      (b) => b.bookIndex === selectedBookIndex + 1,
    );

    if (nextBook) {
      await goToChapter(nextBook.bookIndex, 1);
    }
  };

  const goPrev = async () => {
    if (selectedChapter > 1) {
      await goToChapter(selectedBookIndex, selectedChapter - 1);
      return;
    }

    const prevBook = books.find(
      (b) => b.bookIndex === selectedBookIndex - 1,
    );

    if (prevBook) {
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
    setOpen(false);

    await loadChapters(bookIndex);
    await loadVerses(bookIndex, 1);
  }, []);

  const selectChapter = useCallback(
    async (ch: number) => {
      setSelectedChapter(ch);
      setOpen(false);
      await loadVerses(selectedBookIndex, ch);
    },
    [selectedBookIndex],
  );

  /* ---------------------------- CONFIRM SELECTION ---------------------------- */

  const handleConfirm = useCallback(() => {
    if (!onSelect) return;

    const selected = verses.filter((v) => selectedVerses[v.id]);
    if (!selected.length) return;

    const verseNumbers = selected.map((v) => v.verse);
    const startVerse = Math.min(...verseNumbers);
    const endVerse = Math.max(...verseNumbers);
    const range =
      startVerse === endVerse
        ? `${startVerse}`
        : `${startVerse}-${endVerse}`;

    const currentBook = books.find(
      (b) => b.bookIndex === selectedBookIndex,
    );

    onSelect({
      verses: selected,
      reference: `${currentBook?.book ?? ""} ${selectedChapter}:${range}`,
      text: selected.map((v) => v.text).join(" "),
    });

    setSelectedVerses({});
    onClose();
  }, [
    onSelect,
    verses,
    selectedVerses,
    books,
    selectedBookIndex,
    selectedChapter,
    onClose,
  ]);

  /* ---------------------------- RESET ON OPEN ---------------------------- */

  useEffect(() => {
    if (visible) {
      setSelectedVerses({});
      setHighlightedVerse(null);
      setSearch("");
      setOpen(false);
      setExpandedBook(null);
    }
  }, [visible]);

  /* ---------------------------- FILTER (MEMOIZED) ---------------------------- */

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;

    const lower = search.toLowerCase();

    return books.filter((b) => b.book.toLowerCase().includes(lower));
  }, [search, books]);

  /* ---------------------------- RENDER ITEM (STABLE) ---------------------------- */

  const renderVerse = useCallback(
    ({ item, index }: any) => {
      return (
        <VerseRow
          item={item}
          index={index}
          selected={!!selectedVerses[item.id]}
          onToggle={toggleVerse}
          highlighted={highlightedVerse}
          selectionMode={selectionMode}
        />
      );
    },
    [selectedVerses, toggleVerse, highlightedVerse, selectionMode],
  );

  const renderBook = useCallback(
    ({ item }: any) => {
      return (
        <View className="mb-3 rounded-3xl bg-card-1 overflow-hidden">
          <Pressable
            onPress={() => {
              selectBook(item.bookIndex);
              setExpandedBook((prev) =>
                prev === item.bookIndex ? null : item.bookIndex,
              );
            }}
            className="px-5 py-5 flex-row justify-between"
          >
            <Text className="text-primary font-sora-semibold">
              {item.book}
            </Text>

            <Pressable
              onPress={() =>
                setExpandedBook((prev) =>
                  prev === item.bookIndex ? null : item.bookIndex,
                )
              }
            >
              {expandedBook === item.bookIndex ? (
                <ChevronDown color={isDark ? "#fff" : "#0c0c0c"} />
              ) : (
                <ChevronRight color={isDark ? "#fff" : "#0c0c0c"} />
              )}
            </Pressable>
          </Pressable>

          {expandedBook === item.bookIndex ? (
            <FlatList
              horizontal
              data={chapters}
              keyExtractor={(i) => i.toString()}
              renderItem={({ item: ch }) => (
                <Pressable
                  onPress={() => {
                    selectBook(item.bookIndex);
                    selectChapter(ch);
                  }}
                  className="w-10 h-10 bg-bg m-2 rounded-xl items-center justify-center"
                >
                  <Text className="text-primary">{ch}</Text>
                </Pressable>
              )}
              removeClippedSubviews
              maxToRenderPerBatch={8}
              windowSize={5}
            />
          ) : null}
        </View>
      );
    },
    [expandedBook, chapters, selectBook, selectChapter],
  );

  /* ---------------------------- LOADING ---------------------------- */

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-bg">
        <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
          {/* HEADER */}
          <View className="px-5 pb-3 flex-row justify-between items-center">
            <Pressable
              onPress={onClose}
              className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center"
            >
              <X color={isDark ? "#fff" : "#0c0c0c"} size={18} />
            </Pressable>

            <Pressable
              onPress={() => setOpen(true)}
              className="bg-card-1 px-3 py-2 rounded-xl"
            >
              <Text className="text-primary text-sm font-sora-semibold">
                {books.find((b) => b.bookIndex === selectedBookIndex)?.book ??
                  "Bible"}{" "}
                <Text className="text-secondary">{selectedChapter}</Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setOpen(true)}
              className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center"
            >
              <Search color={isDark ? "#fff" : "#0c0c0c"} size={15} />
            </Pressable>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={isDark ? "#fff" : "#0c0c0c"} />
              <Text className="text-primary mt-4">Loading Bible...</Text>
            </View>
          ) : (
            <>
              {/* VERSES */}
              <FlatList
                ref={flatListRef}
                data={verses}
                renderItem={renderVerse}
                keyExtractor={(item) => item.id}
                removeClippedSubviews
                maxToRenderPerBatch={12}
                windowSize={7}
                initialNumToRender={10}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 140,
                }}
                onScrollToIndexFailed={(info) => {
                  // Fallback scroll on failure
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }}
                ListEmptyComponent={
                  <View className="items-center mt-16">
                    <Text className="text-secondary text-sm font-sora">
                      Select a book and chapter to begin reading
                    </Text>
                  </View>
                }
              />

              {/* BOTTOM ACTIONS */}
              <View className="absolute bottom-0 left-0 right-0 pb-8 px-5">
                <View className="flex-row gap-3">
                  {selectionMode && (
                    <>
                      <Pressable
                        onPress={() => {
                          setSelectedVerses({});
                          onClose();
                        }}
                        className="flex-1 bg-card-1 rounded-xl py-3.5 items-center"
                      >
                        <Text className="text-primary/70 text-sm font-sora-semibold">
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleConfirm}
                        disabled={
                          Object.keys(selectedVerses).length === 0
                        }
                        className={`flex-1 rounded-xl py-3.5 items-center ${
                          Object.keys(selectedVerses).length > 0
                            ? "bg-white"
                            : "bg-card-1"
                        }`}
                      >
                        <Text
                          className={`text-sm font-sora-semibold ${
                            Object.keys(selectedVerses).length > 0
                              ? "text-black"
                              : "text-tertiary"
                          }`}
                        >
                          Add ({Object.keys(selectedVerses).length})
                        </Text>
                      </Pressable>
                    </>
                  )}
                  {!selectionMode && (
                    <View className="flex-row gap-3 flex-1">
                      <Pressable
                        onPress={goPrev}
                        className="flex-1 bg-card-1 rounded-xl py-3.5 items-center flex-row justify-center"
                      >
                        <ChevronLeft color={isDark ? "#fff" : "#0c0c0c"} size={16} />
                        <Text className="text-primary text-sm font-sora-semibold ml-1">
                          Prev
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={goNext}
                        className="flex-1 bg-card-1 rounded-xl py-3.5 items-center flex-row justify-center"
                      >
                        <Text className="text-primary text-sm font-sora-semibold mr-1">
                          Next
                        </Text>
                        <ChevronRight color={isDark ? "#fff" : "#0c0c0c"} size={16} />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* BOOK SELECTION MODAL */}
          <Modal visible={open} transparent animationType="slide">
            <Pressable
              onPress={() => setOpen(false)}
              className="flex-1 justify-end bg-black/60"
            >
              <Pressable onPress={() => {}} className="bg-card-1 rounded-t-[32px]" style={{ maxHeight: "80%" }}>
                {/* Handle */}
                <View className="items-center pt-3 pb-1">
                  <View className="w-10 h-1.5 rounded-full bg-line" />
                </View>
                <View className="flex-row items-center justify-between px-5 pt-2 pb-3 border-b border-line">
                  <Text className="text-primary text-sm font-sora-semibold">
                    Books of the Bible
                  </Text>
                  <Pressable
                    onPress={() => setOpen(false)}
                    className="w-9 h-9 bg-card-2 rounded-xl items-center justify-center"
                  >
                    <X color={isDark ? "#fff" : "#0c0c0c"} size={18} />
                  </Pressable>
                </View>

                {/* SEARCH */}
                <View className="px-5 py-3 border-b border-line">
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

                {/* BOOK LIST */}
                <FlatList
                  data={filteredBooks}
                  renderItem={renderBook}
                  keyExtractor={(i) => i.bookIndex.toString()}
                  removeClippedSubviews
                  maxToRenderPerBatch={10}
                  windowSize={6}
                  contentContainerStyle={{ padding: 16 }}
                />
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}