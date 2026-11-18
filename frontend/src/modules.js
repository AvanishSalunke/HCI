// The four modules shown on the VJTI hub.
// Set `path` to make a module live; leave it null to show "Coming Soon".
export const modules = [
  {
    id: 'academics',
    title: 'Academic Records',
    description: 'Attendance, timetables, results and course material in one place.',
    icon: '🎓',
    path: null,
  },
  {
    id: 'library',
    title: 'Library Management',
    description: 'Book catalogue, issue and return tracking, and due-date reminders.',
    icon: '📚',
    path: null,
  },
  {
    id: 'facilities',
    title: 'Facilities & Hostel',
    description: 'Hostel allotment, room and lab bookings, and maintenance requests.',
    icon: '🏛️',
    path: null,
  },
  {
    id: 'committee',
    title: 'Committee Coordinator',
    description: 'Track expenses, sponsorships and funds for every VJTI committee.',
    icon: '🤝',
    path: '/committees',
  },
];
