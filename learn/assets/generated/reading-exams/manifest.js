(function (global) {
    'use strict';
    const roots = { reading: '', listening: '' };
    const index = [];
    index.pathRoot = { ...roots };
    global.__READING_EXAM_MANIFEST__ = {};
    global.__READING_EXAM_INDEX__ = index;
    global.__READING_EXAM_PATH_ROOT__ = { ...roots };
    global.getReadingExamIndex = function () { const result = []; result.pathRoot = { ...roots }; return result; };
    global.getReadingExamIndex.pathRoot = { ...roots };
    global.completeExamIndex = global.getReadingExamIndex();
})(typeof window !== 'undefined' ? window : globalThis);
