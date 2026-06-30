export interface DictEntry {
    word: string;
    phonetic: string | null;
    audio: string | null;
    meanings: {
        pos: string;
        definition: string;
        example: string | null;
    }[];
}
export declare function useDictionary(): {
    lookup: (word: string) => Promise<DictEntry | null>;
    translate: (word: string) => Promise<string>;
};
