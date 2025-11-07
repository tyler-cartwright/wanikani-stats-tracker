// Application Constants

// API Configuration
export const API_BASE_URL = 'https://api.wanikani.com/v2';
export const API_REVISION = '20170710';

// Rate Limiting
export const RATE_LIMIT_MAX = 60; // requests per minute
export const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

// Cache Expiration Times (milliseconds)
export const CACHE_TIMES = {
    SUBJECTS: 7 * 24 * 60 * 60 * 1000,        // 7 days
    USER: 6 * 60 * 60 * 1000,                 // 6 hours
    ASSIGNMENTS: 5 * 60 * 1000,               // 5 minutes
    REVIEW_STATISTICS: 5 * 60 * 1000,         // 5 minutes
    SUMMARY: 60 * 60 * 1000,                  // 1 hour
    LEVEL_PROGRESSIONS: 24 * 60 * 60 * 1000,  // 24 hours
    REVIEWS: 24 * 60 * 60 * 1000              // 24 hours
};

// SRS Stages
export const SRS_STAGES = {
    UNLOCKING: 0,
    APPRENTICE_1: 1,
    APPRENTICE_2: 2,
    APPRENTICE_3: 3,
    APPRENTICE_4: 4,
    GURU_1: 5,
    GURU_2: 6,
    MASTER: 7,
    ENLIGHTENED: 8,
    BURNED: 9
};

// SRS Stage Names
export const SRS_STAGE_NAMES = {
    0: 'Unlocking',
    1: 'Apprentice I',
    2: 'Apprentice II',
    3: 'Apprentice III',
    4: 'Apprentice IV',
    5: 'Guru I',
    6: 'Guru II',
    7: 'Master',
    8: 'Enlightened',
    9: 'Burned'
};

// SRS Categories
export const SRS_CATEGORIES = {
    APPRENTICE: [1, 2, 3, 4],
    GURU: [5, 6],
    MASTER: [7],
    ENLIGHTENED: [8],
    BURNED: [9]
};

// Subject Types
export const SUBJECT_TYPES = {
    RADICAL: 'radical',
    KANJI: 'kanji',
    VOCABULARY: 'vocabulary',
    KANA_VOCABULARY: 'kana_vocabulary'
};

// Pagination
export const DEFAULT_PAGE_SIZE = 500;

// Storage Keys
export const STORAGE_KEYS = {
    API_TOKEN: 'wk_api_token',
    THEME: 'wk_theme',
    LAST_SYNC: 'wk_last_sync'
};
