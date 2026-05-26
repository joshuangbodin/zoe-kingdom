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

import { sqlite } from "@/libs/sqlite/db";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------------------------- HELPERS ---------------------------- */

const flattenBible = (bible: any[]) => {
  const rows: any[] = [];

  bible.forEach((book, bookIndex) => {
    (book.chapters || []).forEach((chapter: string[], chapterIndex: number) => {
      (chapter || []).forEach((verse: string, verseIndex: number) => {
        if (!verse) return;

        rows.push({
          id: `${bookIndex}-${chapterIndex}-${verseIndex}`, // IMPORTANT FIX
          book: book.name,
          bookIndex,
          chapter: chapterIndex + 1,
          verse: verseIndex + 1,
          text: verse,
        });
      });
    });
  });

  return rows;
};

/* ---------------------------- PURE ROW ---------------------------- */

const VerseRow = memo(
  ({ item, index, selected, onToggle }: any) => {
    return (
      <Pressable
        onPress={() => onToggle(item.id)}
        className="flex-row items-start mb-6"
      >
        <Text className="text-muted text-xs font-sora-semibold mt-1 w-6">
          {index + 1}
        </Text>

        <Text
          className={`flex-1 text-base leading-8 font-serif ${
            selected ? "text-amber-300" : "text-white"
          }`}
        >
          {item.text}
        </Text>
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

  const [loading, setLoading] = useState(true);

  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<any[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<Record<string, boolean>>(
    {},
  );

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

  /* ---------------------------- CACHE (IMPORTANT OPTIMIZATION) ---------------------------- */

  const verseCache = useRef(new Map<string, any[]>());

  /* ---------------------------- INIT ---------------------------- */

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      setLoading(true);

      const exists = await checkBibleExists();

      if (!exists) {
        await seedBible();
      }

      await loadBooks();
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------- DB CHECK ---------------------------- */

  const checkBibleExists = async () => {
    const res = await sqlite.getFirstAsync(
      `SELECT COUNT(*) as count FROM bible_verses`,
    );

    return (res as any)?.count > 0;
  };

  /* ---------------------------- SEED ---------------------------- */

  const seedBible = async () => {
    const BIBLE_URL =
      "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json";

    const res = await fetch(BIBLE_URL);
    const bible = await res.json();

    const rows = flattenBible(bible);

    await sqlite.execAsync("BEGIN TRANSACTION;");

    try {
      const stmt = await sqlite.prepareAsync(`
        INSERT OR IGNORE INTO bible_verses
        (id, book, bookIndex, chapter, verse, text)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const r of rows) {
        await stmt.executeAsync([
          r.id,
          r.book,
          r.bookIndex,
          r.chapter,
          r.verse,
          r.text,
        ]);
      }

      await stmt.finalizeAsync();
      await sqlite.execAsync("COMMIT;");
    } catch (e) {
      await sqlite.execAsync("ROLLBACK;");
      throw e;
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

    const res = await sqlite.getAllAsync(
      `SELECT * FROM bible_verses
       WHERE bookIndex = ? AND chapter = ?
       ORDER BY verse ASC`,
      [bookIndex, chapter],
    );

    verseCache.current.set(key, res);
    setVerses(res);
  };

  const goToChapter = async (bookIndex: number, chapter: number) => {
    setSelectedBookIndex(bookIndex);
    setSelectedChapter(chapter);

    await loadChapters(bookIndex);
    await loadVerses(bookIndex, chapter);
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
        />
      );
    },
    [selectedVerses],
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
            <Text className="text-white font-sora-semibold">{item.book}</Text>

            <Pressable
              onPress={() =>
                setExpandedBook((prev) =>
                  prev === item.bookIndex ? null : item.bookIndex,
                )
              }
            >
              {expandedBook === item.bookIndex ? (
                <ChevronDown color="white" />
              ) : (
                <ChevronRight color="white" />
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
                  <Text className="text-white">{ch}</Text>
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

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" />
        <Text className="text-white mt-4">Loading Bible...</Text>
      </View>
    );
  }

  /* ---------------------------- UI ---------------------------- */

  return (
    <View style={{ paddingTop: top + 10 }} className="flex-1 bg-bg">
      {/* HEADER */}
      <View className="px-5 pb-4 flex-row justify-between items-center">
        <Pressable
          onPress={goPrev}
          className="w-12 h-12 bg-card-1 rounded-2xl items-center justify-center"
        >
          <ChevronLeft color="white" size={22} />
        </Pressable>

        <Pressable
          onPress={() => setOpen(true)}
          className="bg-card-2 px-4 py-2 rounded-2xl"
        >
          <Text className="text-white font-sora-semibold">
            {books.find((b) => b.bookIndex === selectedBookIndex)?.book ??
              "Bible"}{" "}
            {selectedChapter}
          </Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          className="w-12 h-12 bg-card-1 rounded-2xl items-center justify-center"
        >
          <ChevronRight color="white" size={22} />
        </Pressable>
      </View>

      {Object.keys(selectedVerses).length !== 0 && (
        <Pressable
          onPress={() => {
            const selected = verses.filter((v) => selectedVerses[v.id]);

            router.push({
              pathname: "/sharethought",
              params: {
                verses: JSON.stringify(selected),
              },
            });
          }}
          className="absolute bottom-5 z-80 right-5 bg-white px-5 py-3 rounded-2xl"
        >
          <Text className="text-black font-bold">
            Share ({Object.keys(selectedVerses).length})
          </Text>
        </Pressable>
      )}

      {/* VERSES (OPTIMIZED) */}
      <FlatList
        data={verses}
        renderItem={renderVerse}
        keyExtractor={(item) => item.id}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        windowSize={7}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={(_, i) => ({
          length: 80,
          offset: 80 * i,
          index: i,
        })}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      />

      {/* MODAL */}
      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#111] rounded-t-[40px] h-[80%]">
            {/* SEARCH */}
            <View className="p-5 border-b border-[#222]">
              <View className="flex-row items-center bg-card-1 px-4 py-3 rounded-2xl">
                <Search color="#666" size={18} />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search book..."
                  placeholderTextColor="#666"
                  className="flex-1 text-white ml-3"
                />
              </View>

              <Pressable
                onPress={() => setOpen(false)}
                className="absolute right-5 top-5"
              >
                <X color="white" size={20} />
              </Pressable>
            </View>

            {/* BOOK LIST */}
            <FlatList
              data={filteredBooks}
              renderItem={renderBook}
              keyExtractor={(i) => i.bookIndex.toString()}
              removeClippedSubviews
              maxToRenderPerBatch={10}
              windowSize={6}
              initialNumToRender={8}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
