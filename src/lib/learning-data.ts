export interface CuratedResource {
  title: string;
  platform: string;
  url: string;
  isFree: boolean;
  type: 'video' | 'sheet' | 'course' | 'book' | 'interactive' | 'docs';
  description: string;
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  description: string;
  keyConcepts: string[];
  estimatedHours: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  curatedResources: CuratedResource[];
}

export interface LearningTrack {
  id: string;
  title: string;
  badge: string;
  shortDescription: string;
  whatYoullLearn: string;
  rolesHelps: string[];
  targetRoleKey: string; // for ?role= query in setup
  color: {
    primary: string;
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
  };
  roadmap: RoadmapStep[];
}

export interface CareerGuide {
  id: string;
  title: string;
  badge: string;
  shortDescription: string;
  sections: {
    heading: string;
    summary: string;
    bullets: string[];
    examples?: {
      title: string;
      content: string;
      tag?: string;
    }[];
  }[];
}

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: 'sde',
    title: 'SDE & Full-Stack Core Engineering',
    badge: 'Core DSA & CS Fundamentals',
    shortDescription: 'The foundational master track every software engineer needs: core algorithmic problem solving, Big-O complexity, and operating system / database fundamentals.',
    whatYoullLearn: 'Master algorithmic problem-solving patterns, derive time and space complexity (Big-O) on sight, write bug-free code under time constraints, and ace core CS fundamental questions (OS, DBMS, CN, OOP) asked in 95% of technical screenings.',
    rolesHelps: ['Software Development Engineer (SDE I / II)', 'Backend Engineer', 'Full-Stack Developer', 'Core Platform Engineer'],
    targetRoleKey: 'sde',
    color: {
      primary: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'from-indigo-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-indigo-500/10',
      badgeText: 'text-indigo-300 border-indigo-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'Arrays & Strings (Linear Scan, Two Pointers, Sliding Window)',
        description: 'Understand contiguous memory layout, prefix sums, two-pointer convergence, and variable/fixed-size sliding window algorithms.',
        keyConcepts: ['Two Pointers (Left/Right Convergence)', 'Sliding Window (Max Sum Subarray, Longest Substring)', 'Prefix Sum Arrays', 'In-place String Reversals & Kadane’s Algorithm'],
        estimatedHours: 20,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: "Striver's A2Z DSA Sheet — Arrays Track",
            platform: 'TakeUForward',
            url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
            isFree: true,
            type: 'sheet',
            description: 'Comprehensive guided problem sheet with video editorials from beginner brute force to optimal solutions.',
          },
          {
            title: 'NeetCode 150 — Arrays & Hashing',
            platform: 'NeetCode.io',
            url: 'https://neetcode.io/practice',
            isFree: true,
            type: 'interactive',
            description: 'Essential LeetCode blind patterns: Two Sum, Group Anagrams, and Longest Consecutive Sequence.',
          },
          {
            title: 'CodeStoryWithMIK — Sliding Window & Two Pointers Playlist',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@codestorywithmik/playlists',
            isFree: true,
            type: 'video',
            description: 'Intuitive visual explanations with step-by-step dry runs and code templates.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'Recursion & Backtracking',
        description: 'Master the recursion call stack, base conditions, state maintenance, and combinatorial exploration (permutations, subsets, N-Queens).',
        keyConcepts: ['Call Stack Memory & Stack Overflow', 'Subsets, Combinations & Permutations', 'Sudoku Solver & N-Queens', 'Pruning Sub-optimal Recursive Branches'],
        estimatedHours: 18,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Recursion and Backtracking Series',
            platform: 'TakeUForward (Striver)',
            url: 'https://takeuforward.org/recursion/introduction-to-recursion-understand-recursion-by-printing-something-n-times/',
            isFree: true,
            type: 'sheet',
            description: 'Visualizing recursion trees, parameter passing, and backtracking state restoration.',
          },
          {
            title: 'NeetCode Backtracking Practice Set',
            platform: 'NeetCode.io',
            url: 'https://neetcode.io/practice',
            isFree: true,
            type: 'interactive',
            description: 'Curated LeetCode problems: Subsets, Combination Sum, Word Search.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Sorting, Binary Search & Divide and Conquer',
        description: 'Derive O(N log N) merge/quick sort mechanisms, and master binary search on answer spaces (monotonicity condition).',
        keyConcepts: ['Merge Sort & Quick Sort Partitioning', 'Binary Search on Rotated Sorted Arrays', 'Lower Bound / Upper Bound', 'Search on Answer (Aggressive Cows, Book Allocation)'],
        estimatedHours: 15,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Binary Search Master Series',
            platform: 'TakeUForward',
            url: 'https://takeuforward.org/data-structure/binary-search-explained/',
            isFree: true,
            type: 'sheet',
            description: 'From classic binary search to advanced search-on-answer problems.',
          },
          {
            title: 'GeeksforGeeks Sorting Algorithms Analysis',
            platform: 'GeeksforGeeks',
            url: 'https://www.geeksforgeeks.org/sorting-algorithms/',
            isFree: true,
            type: 'interactive',
            description: 'Time/space complexity proofs and stability analysis of sorting algorithms.',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'Linked Lists, Stacks & Queues',
        description: 'Pointer manipulation, fast/slow pointer cycle detection, monotonic stacks, and FIFO queue implementations.',
        keyConcepts: ['Reverse Linked List (Iterative & Recursive)', 'Floyd’s Cycle Detection (Fast & Slow Pointers)', 'Monotonic Stack (Next Greater Element)', 'LRU Cache Design via Doubly Linked List & Hash Map'],
        estimatedHours: 22,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Striver Linked List & Stack/Queue Course',
            platform: 'TakeUForward',
            url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
            isFree: true,
            type: 'sheet',
            description: 'Complete zero-to-hero sheet on linked lists and monotonic stack patterns.',
          },
          {
            title: 'LRU Cache Design Deep-Dive',
            platform: 'NeetCode.io',
            url: 'https://neetcode.io/practice',
            isFree: true,
            type: 'video',
            description: 'Detailed implementation using DLL + HashMap with O(1) get and put.',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'Trees & Binary Search Trees (BST)',
        description: 'Hierarchical data structures, DFS traversals (Pre/In/Post), BFS level-order, tree construction, and BST properties.',
        keyConcepts: ['DFS Traversals & BFS Level Order Traversal', 'Lowest Common Ancestor (LCA)', 'Diameter of Binary Tree & Maximum Path Sum', 'BST Validation & Inorder Successor'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Binary Tree Complete Course by Striver',
            platform: 'YouTube (TakeUForward)',
            url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0q8Hkd7bK2Bpryj2xVJk8Vk',
            isFree: true,
            type: 'video',
            description: 'The golden standard playlist for tree traversals, views, and structural properties.',
          },
          {
            title: 'NeetCode Trees 150',
            platform: 'NeetCode.io',
            url: 'https://neetcode.io/practice',
            isFree: true,
            type: 'interactive',
            description: 'Practice balanced trees, serialize/deserialize, and Trie structures.',
          },
        ],
      },
      {
        stepNumber: 6,
        title: 'Graphs (BFS, DFS, Dijkstra, TopoSort & Disjoint Set Union)',
        description: 'Network connectivity, cycle detection, topological ordering, shortest path algorithms, and minimum spanning trees.',
        keyConcepts: ['Adjacency List Representation & Connected Components', 'Cycle Detection in Directed/Undirected Graphs', 'Kahn’s Algorithm & Topological Sort', 'Dijkstra’s Shortest Path & Disjoint Set Union (DSU)'],
        estimatedHours: 28,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Graph Series by Striver',
            platform: 'TakeUForward',
            url: 'https://takeuforward.org/graph/graph-data-structure-introduction/',
            isFree: true,
            type: 'sheet',
            description: 'Comprehensive graph tutorial covering BFS, DFS, Bellman-Ford, and Prim/Kruskal.',
          },
          {
            title: 'CodeStoryWithMIK — Graph Concepts & LeetCode Hard',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@codestorywithmik/playlists',
            isFree: true,
            type: 'video',
            description: 'Intuitive pattern decomposition for advanced graph and grid problems.',
          },
        ],
      },
      {
        stepNumber: 7,
        title: 'Dynamic Programming (1D, 2D, Grids, Knapsack & Stocks)',
        description: 'Identify overlapping subproblems and optimal substructure. Move from recursion to memoization to tabulation and space optimization.',
        keyConcepts: ['1D DP (Climbing Stairs, Frog Jump)', '0/1 Knapsack & Unbounded Knapsack', 'Longest Common Subsequence (LCS) & Edit Distance', 'Buy/Sell Stocks State Machines & Partition DP'],
        estimatedHours: 35,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'CodeStoryWithMIK — Dynamic Programming Master Playlist',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@codestorywithmik/playlists',
            isFree: true,
            type: 'video',
            description: 'The exact DP problem tracker and pattern breakdown used by top product firm interviewees.',
          },
          {
            title: 'Striver DP Sheet (TakeUForward)',
            platform: 'TakeUForward',
            url: 'https://takeuforward.org/dynamic-programming/striver-dp-series-dynamic-programming-problems/',
            isFree: true,
            type: 'sheet',
            description: '56 progressive DP problems organized by category with recurrence relation proofs.',
          },
        ],
      },
      {
        stepNumber: 8,
        title: 'Computer Science Core Fundamentals (OS, DBMS, CN, OOP)',
        description: 'The core academic fundamentals that every campus placement and lateral tech screening demands.',
        keyConcepts: ['OS: Process vs Thread, Mutex, Semaphore, Virtual Memory, Deadlock', 'DBMS: ACID Properties, B-Tree Indexing, Normalization, SQL Joins, Transactions', 'CN: OSI / TCP-IP 5-Layer Model, HTTP/HTTPS, DNS, WebSockets, Three-Way Handshake', 'OOP: Inheritance, Polymorphism, Abstraction, Encapsulation, SOLID Principles'],
        estimatedHours: 30,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'GeeksforGeeks CS Fundamentals Interview Corner',
            platform: 'GeeksforGeeks',
            url: 'https://www.geeksforgeeks.org/last-minute-notes-operating-systems/',
            isFree: true,
            type: 'interactive',
            description: 'High-yield last minute revision notes on Operating Systems and Database Management.',
          },
          {
            title: 'Gate Smashers — OS & DBMS Playlists',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@GateSmashers/playlists',
            isFree: true,
            type: 'video',
            description: 'Crystal-clear Hindi/English engineering explanations of paging, process scheduling, and SQL indexing.',
          },
        ],
      },
      {
        stepNumber: 9,
        title: 'System Design Basics (Scalability, Caching, Databases)',
        description: 'Understand how real-world distributed architectures handle millions of users, network failures, and data scale.',
        keyConcepts: ['Horizontal vs Vertical Scaling, Load Balancers', 'Caching Strategies (Redis, Memcached, Eviction Policies)', 'Database Sharding, Replication & CAP Theorem', 'Rate Limiting & Asynchronous Message Queues'],
        estimatedHours: 20,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'System Design Primer by Donne Martin',
            platform: 'GitHub',
            url: 'https://github.com/donnemartin/system-design-primer',
            isFree: true,
            type: 'sheet',
            description: 'The most comprehensive open-source roadmap for distributed system architecture.',
          },
          {
            title: 'ByteByteGo System Design Newsletter & Videos',
            platform: 'ByteByteGo (Alex Xu)',
            url: 'https://bytebytego.com/',
            isFree: false,
            type: 'course',
            description: 'Industry-standard visual diagrams explaining URL shorteners, news feeds, and chat apps.',
          },
        ],
      },
    ],
  },

  {
    id: 'frontend',
    title: 'Frontend Engineering',
    badge: 'UI Architecture & Web Standards',
    shortDescription: 'Modern web development from browser internals and JavaScript engines to React ecosystem, state machines, rendering optimization, and UI system design.',
    whatYoullLearn: 'Build scalable modern UI component architectures, master browser rendering pipelines (Critical Rendering Path, reflow/repaint), optimize performance (bundle splitting, virtualization, debounce/throttle), and design complex web applications.',
    rolesHelps: ['Frontend Engineer', 'UI/UX Developer', 'React / Next.js Engineer', 'Web Platform Engineer'],
    targetRoleKey: 'frontend',
    color: {
      primary: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'from-cyan-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-cyan-500/10',
      badgeText: 'text-cyan-300 border-cyan-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'HTML5, CSS3 & Modern Responsive Design',
        description: 'Semantic HTML, CSS box model, Flexbox, Grid, CSS custom properties, and accessible interactive layouts.',
        keyConcepts: ['Semantic Markup & ARIA Accessibility (a11y)', 'Flexbox Axis & CSS Grid Subgrids', 'Responsive Breakpoints & Mobile-First CSS', 'BEM Naming Conventions & CSS Modules'],
        estimatedHours: 15,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: 'roadmap.sh — Frontend Developer Roadmap',
            platform: 'roadmap.sh',
            url: 'https://roadmap.sh/frontend',
            isFree: true,
            type: 'interactive',
            description: 'Step-by-step visual roadmap guide for modern frontend development standards.',
          },
          {
            title: 'freeCodeCamp Responsive Web Design Certification',
            platform: 'freeCodeCamp',
            url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
            isFree: true,
            type: 'interactive',
            description: 'Hands-on interactive browser curriculum covering modern HTML5 and responsive CSS3.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'JavaScript Deep Dive & DOM Manipulation',
        description: 'Execution context, closures, event loop, prototype chain, asynchronous JS, and manual DOM manipulation.',
        keyConcepts: ['Event Loop: Call Stack, Microtask Queue vs Macrotask Queue', 'Closures, Lexical Scope & Hoisting', 'Prototypes & Class Inheritance', 'DOM Traversal, Event Delegation & Bubbling'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'JavaScript.info — The Modern JavaScript Tutorial',
            platform: 'JavaScript.info',
            url: 'https://javascript.info/',
            isFree: true,
            type: 'interactive',
            description: 'The definitive text guide from fundamentals to advanced browser events and async patterns.',
          },
          {
            title: 'Deep JavaScript Foundations by Kyle Simpson',
            platform: 'Frontend Masters',
            url: 'https://frontendmasters.com/courses/deep-javascript-v3/',
            isFree: false,
            type: 'course',
            description: 'World-renowned masterclass on JS types, coercions, scopes, and closure internals.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'React.js & Component Architecture',
        description: 'Declarative UI, Virtual DOM reconciliation, custom hooks, component lifecycles, and React 19 / Server Components concepts.',
        keyConcepts: ['Virtual DOM & Reconciliation Diffing Algorithm', 'Core Hooks: useState, useEffect, useMemo, useCallback, useRef', 'Custom Reusable Hooks Architecture', 'Context API & Compound Component Patterns'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'React Official Documentation (Learn React)',
            platform: 'React.dev',
            url: 'https://react.dev/learn',
            isFree: true,
            type: 'docs',
            description: 'The newly rewritten, interactive official documentation emphasizing thinking in React.',
          },
          {
            title: 'GreatFrontEnd Interview Preparation',
            platform: 'GreatFrontEnd',
            url: 'https://www.greatfrontend.com/',
            isFree: true,
            type: 'interactive',
            description: 'FAANG-level UI coding challenges: implement debounce, throttle, tabs, and modals from scratch.',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'Global State Management & Data Fetching',
        description: 'Client state vs Server state, Redux Toolkit, Zustand, React Query / TanStack Query, and optimistic updates.',
        keyConcepts: ['Redux Toolkit: Slices, Thunks, Immutability via Immer', 'Zustand Minimalist Store Patterns', 'TanStack Query: Caching, Stale Time, Deduplication', 'Optimistic UI Updates & Error Rollbacks'],
        estimatedHours: 18,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Redux Essentials Official Tutorial',
            platform: 'Redux Toolkit',
            url: 'https://redux-toolkit.js.org/tutorials/essentials',
            isFree: true,
            type: 'docs',
            description: 'Official production guidelines for state normalization and async handling.',
          },
          {
            title: 'TanStack Query Documentation & Quickstart',
            platform: 'TanStack',
            url: 'https://tanstack.com/query/latest',
            isFree: true,
            type: 'docs',
            description: 'Industry standard for asynchronous server state synchronization and cache management.',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'Performance Optimization & Browser Internals',
        description: 'Critical rendering path, bundle reduction, lazy loading, debouncing, throttling, and virtualized lists.',
        keyConcepts: ['Reflow (Layout) vs Repaint vs Composite', 'Debouncing vs Throttling Implementation', 'List Virtualization (Rendering 100k items in DOM)', 'Code Splitting, Dynamic Imports & Webpack/Vite Chunks'],
        estimatedHours: 20,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Web.dev Fast Load Times & Core Web Vitals',
            platform: 'Google Developers',
            url: 'https://web.dev/explore/fast',
            isFree: true,
            type: 'interactive',
            description: 'Google engineering guide to LCP, FID, INP, and CLS performance tuning.',
          },
          {
            title: 'Frontend Performance Masterclass',
            platform: 'Frontend Masters',
            url: 'https://frontendmasters.com/',
            isFree: false,
            type: 'course',
            description: 'Profiling DevTools, memory leaks, and render waterfalls.',
          },
        ],
      },
      {
        stepNumber: 6,
        title: 'Frontend System Design (Interview Round Special)',
        description: 'Design complex UI systems: infinite scroll feeds, autocomplete search bars, collaborative rich-text editors, and video streaming players.',
        keyConcepts: ['Data Flow & State Modeling for Infinite Scroll', 'Network Polling vs WebSockets vs Server-Sent Events', 'Offline-First Storage (IndexedDB / LocalStorage)', 'Security: XSS Prevention, CSRF Tokens, Content Security Policy'],
        estimatedHours: 22,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Frontend System Design Guide',
            platform: 'GreatFrontEnd',
            url: 'https://www.greatfrontend.com/system-design',
            isFree: true,
            type: 'interactive',
            description: 'Frameworks to answer open-ended questions like "Design Pinterest Feed" or "Design Google Autocomplete".',
          },
          {
            title: 'Frontend System Design Interview Book',
            platform: 'ByteByteGo / Amazon',
            url: 'https://bytebytego.com/',
            isFree: false,
            type: 'book',
            description: 'Systematic architectural breakdowns for senior frontend engineering rounds.',
          },
        ],
      },
    ],
  },

  {
    id: 'backend',
    title: 'Backend & Distributed Systems',
    badge: 'APIs, Databases & Scalability',
    shortDescription: 'Core backend development: REST & GraphQL API engineering, relational & NoSQL data modeling, caching hierarchies, event-driven message brokers, and distributed systems architecture.',
    whatYoullLearn: 'Architect robust RESTful APIs, design scalable database schemas with high-throughput indexing, prevent race conditions via distributed locks, implement asynchronous pipelines with Kafka/RabbitMQ, and ace high-level system design rounds.',
    rolesHelps: ['Backend Engineer', 'API Platform Developer', 'Distributed Systems Engineer', 'Cloud Infrastructure Developer'],
    targetRoleKey: 'backend',
    color: {
      primary: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'from-emerald-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-emerald-500/10',
      badgeText: 'text-emerald-300 border-emerald-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'Language Fundamentals & Server Runtime Architecture',
        description: 'Master your primary backend language (Node.js/TypeScript, Go, Java, or Python) and asynchronous I/O models.',
        keyConcepts: ['Node.js Event Loop & Libuv Threads vs Go Goroutines', 'Memory Management & Garbage Collection Lifecycles', 'Concurrency: Threads, Synchronization & Race Conditions', 'HTTP/1.1 vs HTTP/2 vs gRPC Protocol Buffers'],
        estimatedHours: 20,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: 'roadmap.sh — Backend Developer Roadmap',
            platform: 'roadmap.sh',
            url: 'https://roadmap.sh/backend',
            isFree: true,
            type: 'interactive',
            description: 'Comprehensive backend engineering roadmap spanning protocols, engines, and storage.',
          },
          {
            title: 'Node.js Architecture & Event Loop Deep Dive',
            platform: 'Node.js Dev Docs',
            url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
            isFree: true,
            type: 'docs',
            description: 'Official explanation of timers, poll phase, check phase, and threadpool delegation.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'RESTful API Design, Middleware & Security',
        description: 'Idempotency, HTTP status semantics, JWT authentication with token rotation, rate limiting, and input validation.',
        keyConcepts: ['Stateless REST Constraints & Richardson Maturity Model', 'JWT Authentication & Refresh Token Rotation', 'Role-Based Access Control (RBAC)', 'Rate Limiting Algorithms (Token Bucket, Leaky Bucket)'],
        estimatedHours: 18,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'RESTful API Design Best Practices',
            platform: 'Microsoft Azure Architecture Center',
            url: 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design',
            isFree: true,
            type: 'docs',
            description: 'Industry-standard guidelines for resource naming, error schemas, and versioning.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Databases (Relational SQL vs NoSQL) & Indexing',
        description: 'PostgreSQL, MySQL, MongoDB, Redis. Schema normalization, B-Tree index structure, query execution plans, and ACID isolation.',
        keyConcepts: ['B-Tree / B+Tree Index Mechanics & Composite Indexes', 'EXPLAIN ANALYZE & Query Optimization', 'Transaction Isolation Levels (Read Committed, Serializable)', 'Database Sharding, Read Replicas & Connection Pooling'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Use The Index, Luke! — SQL Indexing Guide',
            platform: 'Use The Index, Luke',
            url: 'https://use-the-index-luke.com/',
            isFree: true,
            type: 'interactive',
            description: 'The legendary programmer’s guide to SQL indexing and database performance tuning.',
          },
          {
            title: 'PostgreSQL Documentation on Transactions & Concurrency',
            platform: 'PostgreSQL Docs',
            url: 'https://www.postgresql.org/docs/current/mvcc.html',
            isFree: true,
            type: 'docs',
            description: 'Multi-Version Concurrency Control (MVCC) and explicit row locking (SELECT FOR UPDATE).',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'Distributed Caching & In-Memory Storage',
        description: 'Redis caching strategies: Cache-Aside, Write-Through, Write-Back, cache invalidation, and stampede prevention.',
        keyConcepts: ['Cache-Aside vs Write-Through Patterns', 'Cache Penetration, Cache Breakdown & Cache Stampede', 'Redis Data Structures: Hashes, Sorted Sets (ZSET), Bitmaps', 'Distributed Locks via Redlock Algorithm'],
        estimatedHours: 15,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Redis University & Documentation',
            platform: 'Redis.io',
            url: 'https://redis.io/learn',
            isFree: true,
            type: 'interactive',
            description: 'Interactive tutorials on Redis memory management, pub/sub, and persistence (RDB/AOF).',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'Asynchronous Event Streaming & Message Queues',
        description: 'Decoupling services with Apache Kafka and RabbitMQ. Publish/subscribe semantics, partition offsets, and consumer groups.',
        keyConcepts: ['Point-to-Point (Queues) vs Pub/Sub (Event Streams)', 'Kafka Partitions, Consumer Groups & Offsets', 'Idempotent Consumer Patterns & Dead Letter Queues (DLQ)', 'At-least-once vs Exactly-once Delivery Semantics'],
        estimatedHours: 20,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Kafka: The Definitive Guide (Free eBook)',
            platform: 'Confluent',
            url: 'https://www.confluent.io/resources/kafka-the-definitive-guide/',
            isFree: true,
            type: 'book',
            description: 'The authoritative reference for real-time streaming architectures.',
          },
        ],
      },
      {
        stepNumber: 6,
        title: 'System Design & High-Scalability Architecture',
        description: 'CAP Theorem, PACELC, microservices decomposition, consistent hashing, API gateways, and distributed transaction patterns (Saga).',
        keyConcepts: ['CAP Theorem & Eventual Consistency', 'Consistent Hashing for Distributed Caches', 'Saga Pattern vs Two-Phase Commit (2PC)', 'High Availability: Circuit Breakers, Bulkheads & Retries with Jitter'],
        estimatedHours: 35,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Designing Data-Intensive Applications by Martin Kleppmann',
            platform: "O'Reilly / Amazon",
            url: 'https://dataintensive.net/',
            isFree: false,
            type: 'book',
            description: 'The holy grail textbook of backend software engineering, replication, and consensus.',
          },
          {
            title: 'ByteByteGo System Design Channel',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@ByteByteGo',
            isFree: true,
            type: 'video',
            description: 'Visual animations of real-world infrastructure: WhatsApp, Uber, Netflix, and Stripe.',
          },
        ],
      },
    ],
  },

  {
    id: 'ai_ml',
    title: 'Artificial Intelligence & Machine Learning',
    badge: 'Core ML, Deep Learning & LLMs',
    shortDescription: 'From linear algebra, statistics, and classical machine learning algorithms to deep neural networks, transformer architectures, NLP/CV, and model deployment.',
    whatYoullLearn: 'Understand the mathematical foundations of ML, train and evaluate classical models and deep neural networks, explain loss functions and optimization trade-offs in interviews, and serve production models via APIs.',
    rolesHelps: ['Machine Learning Engineer (MLE)', 'Applied AI Scientist', 'Data & ML Systems Developer', 'LLM Application Engineer'],
    targetRoleKey: 'ai_ml',
    color: {
      primary: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'from-purple-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-purple-500/10',
      badgeText: 'text-purple-300 border-purple-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'Python for Scientific Computing (NumPy & Pandas)',
        description: 'Vectorized tensor operations, multidimensional slicing, broadcasting, and high-performance data manipulation.',
        keyConcepts: ['NumPy Vectorization & Matrix Multiplication', 'Pandas DataFrames, GroupBy & Pivot Tables', 'Memory Profiling of Array Operations', 'Vectorized Feature Engineering'],
        estimatedHours: 15,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: 'Kaggle Learn — Python & Pandas Micro-Courses',
            platform: 'Kaggle',
            url: 'https://www.kaggle.com/learn',
            isFree: true,
            type: 'interactive',
            description: 'Hands-on browser Jupyter notebook exercises with immediate automated evaluation.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'Mathematics, Statistics & Linear Algebra Basics',
        description: 'Eigenvectors, matrix decompositions, probability distributions, Bayes rule, and gradient calculus.',
        keyConcepts: ['Dot Products, Matrix Transpose & Determinants', 'Normal Distributions, Mean, Variance & Standard Deviation', 'Conditional Probability & Bayes Theorem', 'Partial Derivatives & Gradient Descent Calculus'],
        estimatedHours: 20,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'StatQuest with Josh Starmer — Machine Learning Playlist',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@statquest',
            isFree: true,
            type: 'video',
            description: 'Unmatched visual intuition for p-values, PCA, ROC curves, and probability distributions.',
          },
          {
            title: '3Blue1Brown — Essence of Linear Algebra',
            platform: 'YouTube',
            url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
            isFree: true,
            type: 'video',
            description: 'Geometric visual representations of matrix transformations and dot products.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Supervised & Unsupervised Machine Learning Algorithms',
        description: 'Linear/Logistic regression, Decision Trees, Random Forests, XGBoost, K-Means clustering, and PCA.',
        keyConcepts: ['Bias-Variance Trade-off & Regularization (L1 Lasso, L2 Ridge)', 'Decision Trees, Gini Impurity & Entropy', 'Ensemble Methods: Bagging (Random Forest) vs Boosting (XGBoost)', 'Evaluation Metrics: Precision, Recall, F1-Score, AUC-ROC'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Machine Learning Specialization by Andrew Ng',
            platform: 'Coursera (DeepLearning.AI)',
            url: 'https://www.coursera.org/specializations/machine-learning-introduction',
            isFree: true,
            type: 'course',
            description: 'The world-famous introductory course on machine learning foundations (free to audit).',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'Deep Learning & Neural Network Architectures',
        description: 'Perceptrons, backpropagation, activation functions, Convolutional Neural Networks (CNNs), and Recurrent Networks (RNN/LSTM).',
        keyConcepts: ['Forward & Backward Propagation Calculus', 'Activation Functions: ReLU, Sigmoid, Softmax & GELU', 'Optimizers: SGD, Momentum, RMSProp, Adam', 'Batch Normalization, Dropout & Vanishing Gradients'],
        estimatedHours: 30,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Practical Deep Learning for Coders',
            platform: 'fast.ai (Jeremy Howard)',
            url: 'https://course.fast.ai/',
            isFree: true,
            type: 'course',
            description: 'Top-down, practical PyTorch course that gets you building state-of-the-art models immediately.',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'Transformers, Large Language Models (LLMs) & NLP',
        description: 'Self-attention mechanism, transformer encoder/decoder, embeddings, Hugging Face ecosystem, and RAG pipelines.',
        keyConcepts: ['Scaled Dot-Product Attention: Q, K, V Vectors', 'Positional Encodings & Multi-Head Attention', 'Vector Embeddings & Cosine Similarity Search (FAISS/Pinecone)', 'Retrieval-Augmented Generation (RAG) Architecture'],
        estimatedHours: 35,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'The Illustrated Transformer by Jay Alammar',
            platform: 'Jay Alammar Blog',
            url: 'https://jalammar.github.io/illustrated-transformer/',
            isFree: true,
            type: 'interactive',
            description: 'The definitive visual guide to how transformers and attention calculations work.',
          },
          {
            title: 'Hugging Face NLP Course',
            platform: 'Hugging Face',
            url: 'https://huggingface.co/learn/nlp-course',
            isFree: true,
            type: 'interactive',
            description: 'Complete hands-on guide to tokenizers, fine-tuning, and model pipelines.',
          },
        ],
      },
      {
        stepNumber: 6,
        title: 'Model Deployment & MLOps Infrastructure',
        description: 'Exporting models to ONNX/TorchScript, FastAPI serving endpoints, Docker containerization, and latency optimization.',
        keyConcepts: ['Serving Models via FastAPI / Flask Microservices', 'Batch Inference vs Real-time Streaming Inference', 'Model Quantization (FP32 to INT8) & GPU Acceleration', 'Data Drift & Model Performance Monitoring'],
        estimatedHours: 20,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Made With ML (MLOps Roadmap)',
            platform: 'Goku Mohandas',
            url: 'https://madewithml.com/',
            isFree: true,
            type: 'interactive',
            description: 'Design, develop, and deploy production machine learning systems with CI/CD and monitoring.',
          },
        ],
      },
    ],
  },

  {
    id: 'data_science',
    title: 'Data Science & Business Analytics',
    badge: 'SQL, Statistics & Product Insights',
    shortDescription: 'End-to-end data analytics: advanced SQL querying, statistical significance, exploratory data analysis, A/B testing experimentation, and executive storytelling.',
    whatYoullLearn: 'Write production-grade complex analytical SQL queries (window functions, self-joins, CTEs), design statistically sound A/B test experiments, derive business metrics (churn, LTV, conversion funnels), and present actionable product decisions.',
    rolesHelps: ['Data Scientist', 'Product Data Analyst', 'Business Intelligence Engineer', 'Growth Analytics Specialist'],
    targetRoleKey: 'data_science',
    color: {
      primary: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'from-amber-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-amber-500/10',
      badgeText: 'text-amber-300 border-amber-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'Advanced SQL Querying for Data Science',
        description: 'Window functions, Common Table Expressions (CTEs), multi-table joins, aggregations, and performance query tuning.',
        keyConcepts: ['Window Functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LEAD(), LAG()', 'Running Totals, Moving Averages & Cumulative Sums', 'Self-Joins, Anti-Joins & CROSS JOINs', 'Recursive CTEs & Query Execution Cost'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'StrataScratch SQL Coding Platform',
            platform: 'StrataScratch',
            url: 'https://www.stratascratch.com/',
            isFree: true,
            type: 'interactive',
            description: 'Real SQL questions asked in Meta, Airbnb, Amazon, and Google data science rounds.',
          },
          {
            title: 'Mode Analytics SQL Tutorial',
            platform: 'Mode',
            url: 'https://mode.com/sql-tutorial/',
            isFree: true,
            type: 'interactive',
            description: 'Comprehensive data-focused SQL walkthrough with real business datasets.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'Python for Data Analysis (Pandas, Matplotlib, Seaborn)',
        description: 'Data wrangling, missing data imputation, outlier detection, distribution analysis, and informative visual charts.',
        keyConcepts: ['Handling Missing Values & Imputation Strategies', 'Outlier Detection (IQR & Z-Score Analysis)', 'Correlation Heatmaps & Pairplots with Seaborn', 'Data Reshaping (Melt, Pivot, Stack/Unstack)'],
        estimatedHours: 20,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: 'Kaggle Data Visualization & Feature Engineering',
            platform: 'Kaggle',
            url: 'https://www.kaggle.com/learn',
            isFree: true,
            type: 'interactive',
            description: 'Hands-on practice building clean charts and extracting high-value predictive signals.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Probability & Inferential Statistics',
        description: 'Hypothesis testing, Central Limit Theorem, confidence intervals, p-values, and statistical power.',
        keyConcepts: ['Central Limit Theorem & Standard Error', 'Hypothesis Testing: Null Hypothesis (H0) vs Alternative (H1)', 'T-Tests, Z-Tests, Chi-Square Tests & ANOVA', 'Type I vs Type II Errors & Statistical Power (1 - Beta)'],
        estimatedHours: 22,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'StatQuest Statistics Fundamentals',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@statquest',
            isFree: true,
            type: 'video',
            description: 'The clearest step-by-step intuition for p-values, t-distributions, and confidence bands.',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'A/B Testing & Experimentation Frameworks',
        description: 'Product experimentation design: sample size calculation, minimum detectable effect (MDE), network spillover, and SRM detection.',
        keyConcepts: ['Sample Size Determination & Minimum Detectable Effect (MDE)', 'Sample Ratio Mismatch (SRM) Diagnosis', 'Variance Reduction Techniques (CUPED)', 'Novelty Effect, Primacy Effect & Multiple Testing Correction (Bonferroni)'],
        estimatedHours: 20,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Expedia / Booking.com Experimentation Papers',
            platform: 'ExpPlatform',
            url: 'https://exp-platform.com/',
            isFree: true,
            type: 'interactive',
            description: 'Real-world industry whitepapers on designing bulletproof online experiments at scale.',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'Product Metrics & Business Case Studies',
        description: 'Metric trees, retention cohorts, user acquisition funnels, LTV calculation, and answering open-ended product interview questions.',
        keyConcepts: ['North Star Metric vs Guardrail Metrics', 'Cohort Retention Tables & Churn Curves', 'Funnel Conversion Analysis & Drop-off Diagnostics', 'Root Cause Analysis Framework for Metric Drops'],
        estimatedHours: 25,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Ace the Data Science Interview by Nick Singh',
            platform: 'Amazon / Book',
            url: 'https://www.acethedatascienceinterview.com/',
            isFree: false,
            type: 'book',
            description: 'Over 200 real interview questions on product sense, probability, and SQL from top tech firms.',
          },
        ],
      },
    ],
  },

  {
    id: 'devops',
    title: 'DevOps & Site Reliability Engineering (SRE)',
    badge: 'Containers, Kubernetes & CI/CD',
    shortDescription: 'Modern cloud infrastructure: Linux systems, Docker containers, Kubernetes orchestration, CI/CD automated pipelines (GitHub Actions/Helm), AWS/GCP cloud, and Prometheus observability.',
    whatYoullLearn: 'Master Linux kernel fundamentals, write production-grade multi-stage Dockerfiles, deploy resilient Kubernetes microservices via Helm charts, architect automated CI/CD deployment pipelines, and configure observability alerts.',
    rolesHelps: ['DevOps Engineer', 'Site Reliability Engineer (SRE)', 'Cloud Infrastructure Engineer', 'Platform / Systems Administrator'],
    targetRoleKey: 'devops',
    color: {
      primary: 'text-orange-400',
      border: 'border-orange-500/30',
      bg: 'from-orange-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-orange-500/10',
      badgeText: 'text-orange-300 border-orange-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'Linux Fundamentals & Shell Scripting',
        description: 'File permissions, process management, bash scripting, networking utilities, and system troubleshooting.',
        keyConcepts: ['File System Hierarchy & Permissions (chmod, chown)', 'Process Signals & Management (ps, top, htop, kill, systemd)', 'Networking CLI: netstat, ss, curl, dig, traceroute, iptables', 'Bash Automation Scripts, Pipes, Redirection & Cron Jobs'],
        estimatedHours: 20,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: 'roadmap.sh — DevOps Engineer Roadmap',
            platform: 'roadmap.sh',
            url: 'https://roadmap.sh/devops',
            isFree: true,
            type: 'interactive',
            description: 'The canonical guide to modern infrastructure, cloud providers, and operational tools.',
          },
          {
            title: 'Linux Journey — Learn Linux Online Free',
            platform: 'Linux Journey',
            url: 'https://linuxjourney.com/',
            isFree: true,
            type: 'interactive',
            description: 'Structured self-paced modules covering command line, text tools, and permissions.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'Containerization with Docker',
        description: 'Namespaces, cgroups, writing efficient multi-stage Dockerfiles, image layer caching, and container networking.',
        keyConcepts: ['Linux Namespaces (PID, NET) & Control Groups (cgroups)', 'Multi-Stage Builds to Minimize Image Attack Surface', 'Docker Compose for Multi-Container Local Stacks', 'Volume Mounts vs Bind Mounts & Secret Security'],
        estimatedHours: 18,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'TechWorld with Nana — Complete Docker Tutorial',
            platform: 'YouTube',
            url: 'https://www.youtube.com/@TechWorldwithNana',
            isFree: true,
            type: 'video',
            description: 'The world’s most popular beginner-to-advanced visual walkthrough of Docker containers.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Kubernetes Orchestration & Helm Packaging',
        description: 'Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, Horizontal Pod Autoscaling (HPA), and Helm charts.',
        keyConcepts: ['Control Plane (API Server, Etcd, Scheduler) vs Worker Nodes (Kubelet, Kube-proxy)', 'Pods, Deployments, ReplicaSets & Rolling Update Strategies', 'ClusterIP vs NodePort vs LoadBalancer Services', 'Helm Charts: Templating, Values, Values Overrides & Release Upgrades'],
        estimatedHours: 30,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Kubernetes Official Interactive Tutorials',
            platform: 'Kubernetes.io',
            url: 'https://kubernetes.io/docs/tutorials/',
            isFree: true,
            type: 'interactive',
            description: 'Hands-on browser clusters to spin up pods, services, and rolling deployments.',
          },
          {
            title: 'KodeKloud CKA / CKAD Training Courses',
            platform: 'KodeKloud',
            url: 'https://kodekloud.com/',
            isFree: false,
            type: 'interactive',
            description: 'Hands-on lab environments for Certified Kubernetes Administrator practical exams.',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'CI/CD Pipelines & Infrastructure as Code (IaC)',
        description: 'Automated testing and continuous delivery via GitHub Actions / GitLab CI, Terraform provisioning, and GitOps.',
        keyConcepts: ['GitHub Actions: Workflows, Jobs, Steps, Matrix Builds, Caching', 'Terraform State, Providers, Resources & Execution Plans', 'GitOps Principles using ArgoCD / Flux', 'Automated Security Scanning (Trivy, SonarQube)'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'GitHub Actions Official Documentation',
            platform: 'GitHub Docs',
            url: 'https://docs.github.com/en/actions',
            isFree: true,
            type: 'docs',
            description: 'Build, test, and deploy code from GitHub repositories with automated triggers.',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'Observability, Monitoring & Reliability (SRE)',
        description: 'Metrics collection with Prometheus, dashboards in Grafana, centralized logging (ELK / Loki), and SLOs/SLIs.',
        keyConcepts: ['Service Level Indicators (SLI), Objectives (SLO) & Error Budgets', 'Prometheus Metric Types: Counter, Gauge, Histogram, Summary', 'Grafana Alerting Rules & Notification Channels', 'Distributed Tracing (OpenTelemetry / Jaeger) for Microservices'],
        estimatedHours: 20,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Google Site Reliability Engineering (SRE) Book',
            platform: 'Google SRE',
            url: 'https://sre.google/sre-book/table-of-contents/',
            isFree: true,
            type: 'book',
            description: 'The foundational book defining how Google operates production systems at global scale.',
          },
        ],
      },
    ],
  },

  {
    id: 'mobile',
    title: 'Mobile Application Engineering',
    badge: 'Native & Cross-Platform Apps',
    shortDescription: 'From mobile languages (Kotlin / Swift / React Native) to declarative UI frameworks, state management, offline local persistence, app lifecycles, and store publishing.',
    whatYoullLearn: 'Master mobile-specific architectural patterns (MVVM / Clean Architecture), handle complex activity/view controller lifecycles without memory leaks, implement offline-first caching with SQLite/Room/CoreData, and pass native mobile interview questions.',
    rolesHelps: ['Android Engineer (Kotlin)', 'iOS Engineer (Swift)', 'React Native Developer', 'Mobile Platform Engineer'],
    targetRoleKey: 'mobile',
    color: {
      primary: 'text-pink-400',
      border: 'border-pink-500/30',
      bg: 'from-pink-950/40 via-slate-900 to-slate-950',
      badgeBg: 'bg-pink-500/10',
      badgeText: 'text-pink-300 border-pink-500/30',
    },
    roadmap: [
      {
        stepNumber: 1,
        title: 'Language Fundamentals (Kotlin / Swift / TypeScript)',
        description: 'Coroutines, memory safety, optional unwrapping, protocols/interfaces, and object-oriented idiomatic conventions.',
        keyConcepts: ['Kotlin Null Safety, Extension Functions & Coroutines Flow', 'Swift Optionals, Generics, ARC (Automatic Reference Counting)', 'Memory Management: Retain Cycles & Weak References', 'Asynchronous Operations on Main Thread vs Background Dispatchers'],
        estimatedHours: 20,
        difficulty: 'Beginner',
        curatedResources: [
          {
            title: 'Kotlin Official Language Documentation & Playground',
            platform: 'Kotlinlang.org',
            url: 'https://kotlinlang.org/docs/home.html',
            isFree: true,
            type: 'docs',
            description: 'Interactive browser playground and standard library documentation.',
          },
          {
            title: 'Apple Swift Programming Language Guide',
            platform: 'Swift.org',
            url: 'https://www.swift.org/documentation/',
            isFree: true,
            type: 'docs',
            description: 'The definitive guide to Swift language syntax and memory ownership.',
          },
        ],
      },
      {
        stepNumber: 2,
        title: 'Declarative UI Frameworks (Jetpack Compose / SwiftUI)',
        description: 'Modern declarative layouts, state hoisting, modifiers, view composition, and animation primitives.',
        keyConcepts: ['Declarative UI vs Imperative XML / Storyboards', 'State Hoisting & Unidirectional Data Flow (UDF)', 'Modifiers, Lazy Columns / Lists & Item Keys', 'Theme Typography & Dark Mode Material Design 3'],
        estimatedHours: 25,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Android Developers Official Training Courses',
            platform: 'Google Android Developers',
            url: 'https://developer.android.com/courses',
            isFree: true,
            type: 'interactive',
            description: 'Hands-on codelabs building modern Jetpack Compose Android applications.',
          },
          {
            title: 'roadmap.sh — Android Developer Roadmap',
            platform: 'roadmap.sh',
            url: 'https://roadmap.sh/android',
            isFree: true,
            type: 'interactive',
            description: 'Clear visual progression for professional Android app engineering.',
          },
        ],
      },
      {
        stepNumber: 3,
        title: 'Mobile Architecture (MVVM & Clean Architecture)',
        description: 'Model-View-ViewModel, Repository pattern, Dependency Injection (Hilt / Koin / Swinject), and separation of concerns.',
        keyConcepts: ['Separation of Concerns & ViewModel Lifecycle Survival', 'Repository Pattern & Clean Architecture Domain Layer', 'Dependency Injection (DI) with Dagger-Hilt / Koin', 'Unit Testing ViewModels with Mock Repositories'],
        estimatedHours: 22,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Guide to App Architecture (Android Developers)',
            platform: 'Google Developers',
            url: 'https://developer.android.com/topic/architecture',
            isFree: true,
            type: 'docs',
            description: 'Google’s official recommendations for robust, testable, and maintainable app architecture.',
          },
        ],
      },
      {
        stepNumber: 4,
        title: 'Local Storage & Offline-First Persistence',
        description: 'Room DB (SQLite), DataStore, CoreData, caching network responses, and background data synchronization.',
        keyConcepts: ['Room Database Entities, DAOs & Migrations', 'Encrypted Shared Preferences & Keychain Security', 'Offline Sync with WorkManager / Background Tasks', 'Cache Invalidation & Network Bound Resource Pattern'],
        estimatedHours: 18,
        difficulty: 'Intermediate',
        curatedResources: [
          {
            title: 'Save Data in a Local Database Using Room',
            platform: 'Android Developers',
            url: 'https://developer.android.com/training/data-storage/room',
            isFree: true,
            type: 'docs',
            description: 'Official guide to SQLite abstraction, schema migrations, and reactive queries.',
          },
        ],
      },
      {
        stepNumber: 5,
        title: 'App Lifecycle, Performance & App Store Publishing',
        description: 'Activity/Fragment lifecycles, memory leak detection with LeakCanary, app bundle signing, and App Store / Play Store guidelines.',
        keyConcepts: ['Activity & Process Death Restoration', 'Detecting Memory Leaks with LeakCanary & Profilers', 'ProGuard / R8 Bytecode Obfuscation & Minification', 'CI/CD Publishing Pipelines with Fastlane'],
        estimatedHours: 15,
        difficulty: 'Advanced',
        curatedResources: [
          {
            title: 'Publish Your App (Google Play Console Docs)',
            platform: 'Google Play',
            url: 'https://developer.android.com/distribute',
            isFree: true,
            type: 'docs',
            description: 'Step-by-step checklist for release management, compliance, and AAB bundle delivery.',
          },
        ],
      },
    ],
  },
];

export const CAREER_PREP_GUIDES: CareerGuide[] = [
  {
    id: 'resume_guide',
    title: 'Resume Writing Masterclass (FAANG & ATS Proof)',
    badge: 'ATS Score 85+ Guide',
    shortDescription: 'Practical, no-fluff guide to engineering resumes: the Google XYZ formula, ATS keyword optimization, layout rules, and concrete bullet rewrite examples.',
    sections: [
      {
        heading: "The Google XYZ Formula for Technical Bullets",
        summary: "Top tech recruiters and engineering managers evaluate bullets using the XYZ formula: 'Accomplished [X], as measured by [Y], by doing [Z]'. Bullets without quantifiable metrics are skipped within 6 seconds.",
        bullets: [
          "Start every single bullet with a strong action verb (Engineered, Architected, Optimized, Implemented, Streamlined).",
          "Always quantify the scale: request volume (10k req/day), latency reduction (35% faster p95), database scale (2M rows), or memory savings (40% less footprint).",
          "Specify the exact tools, algorithms, or techniques used in [Z] (e.g. 'using Redis caching and connection pooling in PostgreSQL').",
          "Never write passive descriptions like 'Worked on backend API' or 'Was responsible for database'.",
        ],
        examples: [
          {
            title: "Bad (Vague & Passive)",
            content: "Worked on building an e-commerce backend with Node.js and MongoDB and helped fix slow database queries.",
            tag: "Needs Revision",
          },
          {
            title: "Good (Google XYZ Formula)",
            content: "Engineered high-throughput checkout microservice handling 15,000 daily orders, reducing checkout latency by 38% (from 850ms to 520ms) by implementing Redis session caching and composite indexing on PostgreSQL.",
            tag: "ATS Optimized",
          },
        ],
      },
      {
        heading: "ATS Machine Readability Checklist",
        summary: "80% of enterprise applications are scanned by Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo) before any human sees them. Avoid formatting traps that break machine parsers.",
        bullets: [
          "Single column layout only: Never use two-column templates, graphical progress bars for skills, or tables. ATS parsers read across rows and mangle two-column text.",
          "Standard Section Headings: Use exact standard titles: 'Education', 'Technical Skills', 'Experience', 'Projects', 'Certifications'. Avoid creative titles like 'What I’ve Built' or 'Academic Journey'.",
          "Clear Tech Stack Subcategories: Categorize skills into 'Languages', 'Frameworks/Libraries', 'Databases & Storage', and 'DevOps & Cloud Tools'.",
          "Clean PDF Export: Ensure text can be highlighted and copied from your exported PDF. Never upload an image-based PDF or scanned document.",
          "Keep length to exactly 1 page for 0-4 years of experience.",
        ],
      },
    ],
  },

  {
    id: 'behavioral_guide',
    title: 'Behavioral & HR Round Prep (STAR Framework)',
    badge: 'Culture Fit & Leadership Principles',
    shortDescription: 'Frameworks to answer open-ended situational questions: the STAR method, handling conflict, explaining failures, and demonstrating technical ownership.',
    sections: [
      {
        heading: "The STAR Framework (Situation, Task, Action, Result)",
        summary: "Behavioral interviewers look for emotional maturity, proactive problem-solving, and accountability under pressure. Structure every behavioral story in 4 crisp stages:",
        bullets: [
          "S — Situation (15%): Set the stage in 2-3 sentences. What was the company/project context and what problem arose?",
          "T — Task (15%): Clarify your exact responsibility. What were you specifically tasked with solving or delivering?",
          "A — Action (50%): The core of your answer. Walk through the concrete technical and interpersonal steps YOU personally took. Use 'I', not just 'we'.",
          "R — Result (20%): Quantifiable outcome and what you learned. What happened after? Did the deployment succeed? What would you do differently today?",
        ],
        examples: [
          {
            title: "Common Prompt: 'Tell me about a time you faced a critical bug in production.'",
            content: "S: During our college capstone project demo week, our real-time messaging server crashed under simultaneous load from 200 concurrent student testers.\nT: As backend lead, I was responsible for finding the root cause and restoring service within 2 hours before faculty evaluation.\nA: I inspected server error logs, identified unhandled WebSocket disconnections exhausting socket file descriptors, implemented heartbeat ping/pong timeouts, and added a circuit breaker.\nR: The server stabilized with zero memory leaks, handled 500+ active connections during the final presentation, and taught me the necessity of connection pooling and load stress testing.",
            tag: "STAR Example",
          },
        ],
      },
      {
        heading: "Top 5 Non-Negotiable Behavioral Questions",
        summary: "Prepare and practice 2-minute answers for these five questions before any final round interview:",
        bullets: [
          "1. 'Tell me about yourself': Focus 80% on recent technical projects, the engineering challenges that excite you, and why this company's domain aligns with your career goals.",
          "2. 'Tell me about a disagreement with a team member': Highlight mutual respect, data-driven debate (running benchmarks rather than arguing opinions), and committing to the decision.",
          "3. 'What is your greatest technical weakness?': Cite a real technical gap you actively take steps to improve (e.g. 'Previously I jumped straight into coding without drafting architecture diagrams; now I create RFC specs first').",
          "4. 'Why do you want to work at this company?': Reference specific engineering blogs, products, or architectural scale the company handles.",
          "5. 'Do you have any questions for us?': Always ask thoughtful questions (e.g. 'What is the team’s on-call rotation like?' or 'What is the biggest technical debt your team is solving this quarter?').",
        ],
      },
    ],
  },

  {
    id: 'placement_funnel',
    title: 'Indian Campus & Lateral Placement Funnel Explainer',
    badge: 'Hiring Funnel Blueprint',
    shortDescription: 'A realistic breakdown of the 4-stage engineering hiring pipeline: Online Assessment (OA), Group Discussion, Technical Screening Rounds, and HR / Bar Raiser.',
    sections: [
      {
        heading: "The 4-Stage Placement Funnel Breakdown",
        summary: "Understanding the evaluation criteria of each round allows you to allocate your study time effectively and avoid getting screened out early.",
        bullets: [
          "Stage 1: Online Assessment (OA / Aptitude + 2-3 DSA Questions): 60-90 minutes on HackerRank/Mettle/CodeSignal. Tests speed and edge case coverage. You must pass 100% of test cases including hidden boundary constraints (integer overflow, timeout on O(N^2)).",
          "Stage 2: Group Discussion (GD / Jam Round - Campus Only): Tests articulation, listening skills, and structured argumentation. Never interrupt aggressively; summarize points and introduce fresh data perspectives.",
          "Stage 3: Technical Round 1 (DSA & Live Code Implementation): 45-60 minutes live coding. The interviewer grades you on thinking out loud, stating Big-O upfront, dry running test cases with pointer diagrams, and writing working syntax.",
          "Stage 4: Technical Round 2 (Projects, CS Fundamentals & System Design): Probes deep into your resume projects. Interviewers will challenge your architectural decisions, write conflicts, database indexing, and rollback strategies.",
          "Stage 5: HR / Hiring Manager (Culture & Offer): Tests alignment, communication, salary expectations, and willingness to learn.",
        ],
      },
      {
        heading: "How to Avoid Instant Disqualification",
        summary: "Common fatal mistakes candidates make that lead to immediate rejection across rounds:",
        bullets: [
          "Silence during live coding: Remaining silent for 10 minutes while thinking makes interviewers think you are stuck. Always speak out loud.",
          "Jumping to code without clarifying constraints: Always ask: 'What are the array constraints? Can numbers be negative? Is the array sorted? What should we return on null input?'.",
          "Faking resume credentials: If you list Docker or Redis on your resume, expect deep follow-up questions on Docker network bridges and cache eviction policies.",
          "Argue defensively when given interviewer hints: Hints are a test of coachability. Always say 'Thank you, let me incorporate that edge case into my logic'.",
        ],
      },
    ],
  },
];
