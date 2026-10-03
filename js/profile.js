/* Single source of truth for the profile numbers: skills, roles, level scale.
   Loaded before app.js (renders the lists) and charts.js (renders the charts).
   Each skill/role may carry a third value: a key into window.AGNA_ICONS for the
   brand glyph shown beside the name. */
(function () {
  'use strict';
  window.AGNA_PROFILE = {
    skills: [
      ['Python', 'Intermediate', 'python'],
      ['HTML', 'Master', 'html5'],
      ['JavaScript', 'Advanced', 'javascript'],
      ['PHP', 'Upper-Intermediate', 'php'],
      ['C#', 'Elementary', 'dotnet'],
      ['Kotlin', 'Advanced', 'kotlin'],
      ['Swift', 'Elementary', 'swift'],
      ['Dart', 'Elementary', 'dart'],
      ['TypeScript', 'Elementary', 'typescript'],
      ['C', 'Elementary', 'c'],
      ['SQL', 'Intermediate', 'database'],
      ['Git & GitHub', 'Advanced', 'github']
    ],
    roles: [
      ['UI/UX Design', 8, null],
      ['Fullstack Developer', 5, null],
      ['Front-end Developer', 4, null],
      ['React', 4, 'react'],
      ['Back-end Developer', 3, null],
      ['Network Security', 3, null],
      ['Android Developer', 2, 'android'],
      ['Mobile Apps Developer', 2, null],
      ['iOS Developer', 1, 'apple'],
      ['Software Engineer', 1, null],
      ['SQL', 1, 'database']
    ],
    // 1–5 scale used by the radar chart; labels match the strings in `skills`.
    levels: [
      ['Master', 5], ['Advanced', 4], ['Upper-Intermediate', 3], ['Intermediate', 2], ['Elementary', 1]
    ]
  };
})();
