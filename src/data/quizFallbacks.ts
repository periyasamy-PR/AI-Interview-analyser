export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizSet {
  questions: QuizQuestion[];
}

const fallbacks: Record<string, Record<string, QuizQuestion[]>> = {
  Frontend: {
    Entry: [
      {
        question: "Which HTML5 tag is used to specify a footer for a document or section?",
        options: ["<bottom>", "<footer>", "<section>", "<aside>"],
        correctAnswer: 1
      },
      {
        question: "In CSS, what is the default value of the postion property?",
        options: ["absolute", "relative", "static", "fixed"],
        correctAnswer: 2
      },
      {
        question: "What does the 'typeof' operator return for a Javascript array?",
        options: ["array", "object", "list", "undefined"],
        correctAnswer: 1
      },
      {
        question: "Which React hook is used to perform side effects in functional components?",
        options: ["useState", "useContext", "useEffect", "useMemo"],
        correctAnswer: 2
      },
      {
        question: "What is the correct way to write a comment in CSS?",
        options: ["// comment", "<!-- comment -->", "/* comment */", "' comment"],
        correctAnswer: 2
      }
    ],
    Mid: [
      {
        question: "What is the virtual DOM in React primarily used for?",
        options: [
          "Direct handling of user inputs",
          "Interfacing with external backend databases directly",
          "Efficiently rendering UI changes by batching DOM updates and diffing",
          "Translating React code into native mobile interface modules"
        ],
        correctAnswer: 2
      },
      {
        question: "Which of the following correctly describes 'closure' in JavaScript?",
        options: [
          "A mechanism to close inactive browser tabs",
          "A function bundled together with references to its surrounding state (lexical environment)",
          "An advanced browser encryption API",
          "A strict memory garbage collection cycle"
        ],
        correctAnswer: 1
      },
      {
        question: "How does the CSS grid property 'grid-template-areas' differ from 'grid-template-columns'?",
        options: [
          "It defines naming slots for grid items rather than raw size guidelines",
          "It is only compatible with inline styling elements",
          "It is automatically deprecated in modern layouts",
          "It only supports pixel widths"
        ],
        correctAnswer: 0
      },
      {
        question: "What is the key benefit of Webpack/Vite code-splitting standard workflows?",
        options: [
          "Prevents reverse-engineering of compiled client code",
          "Speeds up page load times by serving assets in smaller lazy-loaded bundles",
          "Guarantees that database calls happen within under 5 milliseconds",
          "Clears runtime browser storage automatically on user exit"
        ],
        correctAnswer: 1
      },
      {
        question: "In JavaScript, what is the main difference between active '==' and '===' comparison operators?",
        options: [
          "'==' triggers variable reassignment, while '===' evaluates equivalence",
          "'==' checks values only with type coercion, while '===' checks both value and strict type",
          "'===' is for frontend variables, '==' is for backend storage variables",
          "There is no difference in modern browsers"
        ],
        correctAnswer: 1
      }
    ],
    Senior: [
      {
        question: "Which React 18 feature allows you to prioritize updates to reduce visual input lag on complex charts or search filters?",
        options: ["useDeferredValue & startTransition", "useLayoutEffect", "useImperativeHandle", "Suspense boundaries"],
        correctAnswer: 0
      },
      {
        question: "To prevent memory leaks when establishing ResizeObservers in highly dynamic React components, which cleanup strategy is ideal?",
        options: [
          "Do nothing; browser engines always garbage-collect native observers automatically",
          "Disconnect the observer in the clean-up callback of useEffect using .disconnect()",
          "Use a forceUpdate state cycle whenever elements unmount",
          "Set the observed element height directly to zero before deletion"
        ],
        correctAnswer: 1
      },
      {
        question: "What is the critical vulnerability solved by establishing HttpOnly and Secure flags on web application cookies?",
        options: [
          "Database SQL Injection",
          "Cross-Site Scripting (XSS) extraction of session tokens",
          "Denial of Service (DoS) server load spikes",
          "DNS Cache Poisoning attacks"
        ],
        correctAnswer: 1
      },
      {
        question: "When tuning Core Web Vitals, how can you effectively eliminate Cumulative Layout Shift (CLS)?",
        options: [
          "Minify all JavaScript bundles to under 50KB",
          "Explicitly set width/height attributes or CSS aspect ratios on media elements",
          "Implement lazy image loading on every asset",
          "Use a global CDN with edge caching"
        ],
        correctAnswer: 1
      },
      {
        question: "Which compilation strategy represents the primary difference between CSR (Client-Side Rendering) and SSR/SSG?",
        options: [
          "SSR moves data validation constraints entirely to the edge network",
          "SSR renders the initial HTML structure on the server-side, shipping interactive scripts for routing updates later (hydration)",
          "CSR compiles compiled modules to WebAssembly bytecode prior to execution",
          "There is no difference in compiled code output"
        ],
        correctAnswer: 1
      }
    ]
  },
  Backend: {
    Entry: [
      {
        question: "What does SQL stand for in database administration?",
        options: [
          "Simple Queue Language",
          "Structured Query Language",
          "System Query Loop",
          "Symmetric Queue Layout"
        ],
        correctAnswer: 1
      },
      {
        question: "Which HTTP status code signifies that a resource was successfully created?",
        options: ["200 OK", "201 Created", "302 Found", "400 Bad Request"],
        correctAnswer: 1
      },
      {
        question: "What is the main role of middleware in an Express application?",
        options: [
          "To interface directly with the CPU to monitor temperature variables",
          "To execute functions block-by-block during the request-response lifecycle",
          "To handle HTML compilation for client browsers with strict margins",
          "To act as a physical load balancer"
        ],
        correctAnswer: 1
      },
      {
        question: "Which HTTP method is conventionally considered idempotent?",
        options: ["POST", "PUT", "PATCH", "None of these"],
        correctAnswer: 1
      },
      {
        question: "What formatting protocol is primarily utilized for backend API data transfers in modern rest architectures?",
        options: ["XML", "JSON", "Plaintext", "YAML"],
        correctAnswer: 1
      }
    ],
    Mid: [
      {
        question: "Which indexing approach offers the fastest retrieval times for exact match queries in Relational Database Systems?",
        options: ["B-Tree Index", "Hash Index", "Sparse Index", "Clustered Index"],
        correctAnswer: 1
      },
      {
        question: "How does Node.js handle async I/O operations despite running on a single-threaded Javascript thread?",
        options: [
          "By employing worker processes on each logical CPU core automatically",
          "Via the Event Loop delegating system operations to custom OS thread pools (libuv)",
          "By strictly forbidding the use of nested loops",
          "By compiling JavaScript directly to machine code at runtime"
        ],
        correctAnswer: 1
      },
      {
        question: "What properties make up the ACID transactions guarantee in ACID-compliant databases?",
        options: [
          "Availability, Concurrency, Isolation, Durability",
          "Atomicity, Consistency, Isolation, Durability",
          "Atomicity, Concurrency, Integrity, Distribution",
          "Availability, Consistency, Integrity, Durability"
        ],
        correctAnswer: 1
      },
      {
        question: "Which strategy is most effective to protect user passwords stored in a Relational Database against rainbow table attacks?",
        options: [
          "Hashing them with SHA-256",
          "Encrypting them with direct symmetric key pairs",
          "Hashing with cryptographic salt values using a robust algorithm like bcrypt or Argon2",
          "Storing them in plain text on an encrypted file system volume"
        ],
        correctAnswer: 2
      },
      {
        question: "What is the key advantage of a connection pool over individual manual database connection setups?",
        options: [
          "It guarantees encryption of SQL syntax parsing in transit",
          "It reuses a collection of persistent active connections to eliminate connection setup overhead",
          "It automatically runs backups during slow database cycles",
          "It resolves circular tables without throwing query exceptions"
        ],
        correctAnswer: 1
      }
    ],
    Senior: [
      {
        question: "When applying DB Sharding, what is the 'Hotspot' or 'Celebrity' problem, and how is it resolved?",
        options: [
          "A shard becomes overwhelmed with traffic due to uneven key distribution. Resolved by salting the shard keys or re-sharding",
          "Vulnerability to SQL Injection. Resolved by using parameterized statements",
          "High network overhead on the DB servers due to CSS layout issues. Resolved by using smaller bundles",
          "Overheating data center fans. Resolved by upgrading hardware nodes"
        ],
        correctAnswer: 0
      },
      {
        question: "Under high concurrent write throughput, which technique minimizes database lock contention in distributed architectures?",
        options: [
          "Switching to synchronous replication across all backup nodes",
          "Using Optimistic Locking (MVCC) or write buffering through memory queues like Kafka/RabbitMQ",
          "Force-killing idle reader connection threads manually",
          "Replacing relational tables with unindexed JSON documents"
        ],
        correctAnswer: 1
      },
      {
        question: "In a microservice mesh, how does the Saga Pattern handle transaction consistency across separate databases?",
        options: [
          "By locking all tables globally across all microservices until all edits succeed",
          "By defining a sequence of local transactions, triggering compensating transactions if any step fails",
          "By routing all updates to a single centralized physical database instance",
          "By running daily database schema alignment cron processes"
        ],
        correctAnswer: 1
      },
      {
        question: "What is the best way to handle 'race conditions' when updating user wallet balances stored in a distributed datastore?",
        options: [
          "Store the balances in a local JSON file first",
          "Use Atomic increments or Pessimistic locking (SELECT FOR UPDATE) inside a transaction",
          "Refresh the frontend dashboard every 500 milliseconds automatically",
          "Rely on client side application state logic constraints"
        ],
        correctAnswer: 1
      },
      {
        question: "How does OAuth 2.0 PKCE (Proof Key for Code Exchange) secure authorization code flows against interception?",
        options: [
          "It replaces access tokens with double-session variables",
          "It introduces a dynamically generated code verifier and challenge to validate token exchange requests at the auth server",
          "It encrypts the entire user credentials during inputs directly",
          "It restricts redirect URIs to internal subnets only"
        ],
        correctAnswer: 1
      }
    ]
  },
  "Full Stack": {
    Entry: [
      {
        question: "Which tool or library is commonly used to establish full-duplex dynamic real-time communication between browser and server?",
        options: ["Postman", "Socket.io / WebSockets", "Fetch API", "Express Router"],
        correctAnswer: 1
      },
      {
        question: "What does JWT stand for in user verification flows?",
        options: ["Java Web Token", "JSON Web Token", "Job Work Tracker", "Joint Wire Transfer"],
        correctAnswer: 1
      },
      {
        question: "To prevent CORS errors in local development, where should CORS configuration properties be applied?",
        options: ["On the client React configuration", "On the backend server routing or response headers", "In the database schema configuration", "Inside the developer's computer hosts file"],
        correctAnswer: 1
      },
      {
        question: "What is the primary role of the package.json file in node web applications?",
        options: [
          "To specify CSS media query dimensions for tablets",
          "To store user credentials securely in plain text",
          "To document project metadata, run scripts, and list dependency versions",
          "To host binary images and video assets"
        ],
        correctAnswer: 2
      },
      {
        question: "What does MVC represent in application architecture?",
        options: ["Model-View-Controller", "Map-Vector-Class", "Multi-Version-Concurrency", "Mobile-Visual-Cache"],
        correctAnswer: 0
      }
    ],
    Mid: [
      {
        question: "What is the security risk of storing sensitive JWTs directly inside localStorage?",
        options: [
          "LocalStorage requires persistent file writes that degrade SSD hardware over time",
          "Tokens stored in localStorage are vulnerable to extraction via Cross-Site Scripting (XSS)",
          "Tokens are automatically wiped on every page reload",
          "LocalStorage has a maximum storage limit of only 50 bytes"
        ],
        correctAnswer: 1
      },
      {
        question: "In a modular architecture, what is the role Of Double Summation DB queries compared to N+1 query patterns?",
        options: [
          "N+1 triggers 1 initial query followed by N subsequent queries for associated relations, resulting in bad performance. Solved via joins or batch loading",
          "Double Summation is an optimization for binary storage matrices",
          "There is no difference between them in production latency",
          "N+1 is an automated indexing pipeline"
        ],
        correctAnswer: 0
      },
      {
        question: "What does the HTTP header 'Cache-Control: no-cache, no-store' instruct the client browser to do?",
        options: [
          "Disable security inspections of downloaded code files",
          "Prevent caching of the request or response in any local storage or intermediate caches",
          "Restrict styling modifications from propagating to child nodes",
          "Use localized storage instead of cloud queries"
        ],
        correctAnswer: 1
      },
      {
        question: "How do CSRF (Cross-Site Request Forgery) tokens protect state-changing backend endpoints?",
        options: [
          "They encrypt the request body with a symmetric hash key",
          "They ensure requests originate from a trusted user session by validating a unique, server-generated secret token shipped with the form",
          "They block visual styling overrides from loading",
          "They restrict backend ports to single processes"
        ],
        correctAnswer: 1
      },
      {
        question: "Which database design phase produces tables with no multi-valued dependencies or partial primary key dependencies?",
        options: ["Indexing Phase", "Database Normalization (up to 3NF/BCNF)", "NoSQL Document Aggregation", "View Materialization Phase"],
        correctAnswer: 1
      }
    ],
    Senior: [
      {
        question: "When deploying a high-traffic e-commerce system, which caching pattern ensures that read performance is fast while keeping DB and cache synced?",
        options: ["Cache-Aside (Lazy Loading) combined with explicit write-through invalidation", "Blind cache expiration every 24 hours", "Storing tables as JSON strings directly in browser cookies", "Restricting write transactions to single hourly windows"],
        correctAnswer: 0
      },
      {
        question: "To protect a REST API from automated scraping or brute force attacks without impacting real users, what strategy is recommended?",
        options: [
          "IP-based Rate Limiting (Token Bucket algorithm) and API rate ceilings with status 429",
          "Changing the backend port number every day manually",
          "Wiping database rows that receive more than 10 reads per minute",
          "Encrypting CSS assets on compilation"
        ],
        correctAnswer: 0
      },
      {
        question: "In micro-frontend systems, how can state be securely shared between isolated components without coupling them?",
        options: [
          "Using browser custom events, a shared micro-kernel state manager, or lightweight standard pub/sub channels",
          "Storing values globally on the physical window object under random names",
          "Writing update values continuously into shared text files",
          "Coupling individual routes with absolute URLs"
        ],
        correctAnswer: 0
      },
      {
        question: "Which strategy represents the most secure method for authenticating server-to-server API communications?",
        options: [
          "Using mutual TLS (mTLS) with cryptographically validated client certificates, or rotating API Keys scoped via OAuth 2.0 client credentials grant",
          "Sharing direct SQL admin credentials",
          "Routing communications through open HTTP ports with hidden headers",
          "Relying on hardcoded network IP addresses without validation"
        ],
        correctAnswer: 0
      },
      {
        question: "When troubleshooting memory leaks in a server-side Node.js application, which approach is most effective for diagnostic identification?",
        options: [
          "Generating and comparing heap snapshots during active user scenarios using Chrome DevTools or Clinic.js",
          "Wiping the node_modules folder and running npm install again",
          "Adding try/catch blocks around every single operation",
          "Increasing the physical hosting plan size indefinitely"
        ],
        correctAnswer: 0
      }
    ]
  },
  "System Design": {
    Entry: [
      {
        question: "What is the primary purpose of a Load Balancer in system design?",
        options: [
          "To automatically index backend database rows",
          "To distribute incoming network traffic across multiple servers",
          "To run unit tests before staging code",
          "To encrypt client requests at the physical router level"
        ],
        correctAnswer: 1
      },
      {
        question: "What is the purpose of a CDN (Content Delivery Network)?",
        options: [
          "To manage physical database operations",
          "To cache static assets geographically closer to users to reduce latency",
          "To encrypt user bank transactions",
          "To compile React files dynamically"
        ],
        correctAnswer: 1
      },
      {
        question: "What is the main difference between horizontal scaling and vertical scaling?",
        options: [
          "Horizontal scaling adds more machines; vertical scaling adds more power (CPU/RAM) to an existing machine",
          "Horizontal scaling edits file formats; vertical scaling optimizes CSS structures",
          "Vertical scaling is only compatible with SQL databases",
          "Horizontal scaling requires physical hardware replacement"
        ],
        correctAnswer: 0
      },
      {
        question: "Which of the following serves as the fastest cache storage layer?",
        options: ["HDD Drive", "In-Memory Storage (e.g., Redis)", "SSD Drive", "Cloud Storage Bucket"],
        correctAnswer: 1
      },
      {
        question: "What does DNS represent in networking?",
        options: ["Data Network System", "Domain Name System", "Distributed Node System", "Document Name Sync"],
        correctAnswer: 1
      }
    ],
    Mid: [
      {
        question: "In distributed systems, what does the CAP Theorem state about database guarantees?",
        options: [
          "An system can consistently scale and guarantee CPU speed, Allocations, and Ports simultaneously",
          "A distributed data store can simultaneously provide at most two of: Consistency, Availability, and Partition Tolerance",
          "All relational databases always guarantee infinite Availability, Processing speed, and Cache scaling",
          "Web servers can only support 2 of the 3 key browser engines"
        ],
        correctAnswer: 1
      },
      {
        question: "Which mechanism allows databases to synchronize changes across master and replica nodes asynchronously?",
        options: [
          "Database Sharding",
          "Replication (e.g. Binlog shipping or Transaction logging)",
          "Continuous Schema Aggregation",
          "Automatic query parameterization"
        ],
        correctAnswer: 1
      },
      {
        question: "What is the main drawback of incorporating a microservices architecture compared to a monolithic structure?",
        options: [
          "Slower processing speeds inside isolated components",
          "Increased operational complexity, deployment management, and data synchronization overhead",
          "Inability to handle relational database engines",
          "Strict limitations on frontend styling files"
        ],
        correctAnswer: 1
      },
      {
        question: "Why would you introduce a message broker like Apache Kafka or RabbitMQ into software designs?",
        options: [
          "To compile JavaScript code on servers",
          "To decouple services and handle asynchronous workflows reliably through message queues",
          "To direct web browser search traffic to DNS assets",
          "To run database automated structural backups"
        ],
        correctAnswer: 1
      },
      {
        question: "How does optimistic concurrency control differ from pessimistic concurrency control?",
        options: [
          "Optimistic works by assuming conflicts are rare and validation happens on commit; pessimistic locks resources on read to deny concurrent updates",
          "Optimistic is only used on client browsers; pessimistic is used on server databases",
          "Optimistic is faster for highly contested, high-overlap transaction tables",
          "There is no difference between them in database locking architectures"
        ],
        correctAnswer: 0
      }
    ],
    Senior: [
      {
        question: "To coordinate state changes and maintain data consistency across decoupled microsservices, which strategy balances performance and reliability?",
        options: [
          "Event Sourcing combined with CQRS (Command Query Responsibility Segregation)",
          "Restricting service access to single daily synchronization windows",
          "Using distributed 2-Phase Commit (2PC) locks across all endpoints",
          "Mounting a shared physical drive to all microservices"
        ],
        correctAnswer: 0
      },
      {
        question: "Which mechanism allows consistent hashing rings to balance node distributions when hardware nodes are added or removed?",
        options: [
          "Virtual Nodes (vnodes) mapped to physical instances across the ring hash spaces",
          "Dynamic primary key swapping",
          "Wiping the cache keys completely upon any topology change",
          "Forcing all client connections to route to the newest active node"
        ],
        correctAnswer: 0
      },
      {
        question: "How do vector databases (e.g., Pinecone, Milvus) quickly process similarity searches for AI applications?",
        options: [
          "By utilizing indexes like HNSW or IVF on dense high-dimensional vector representations",
          "By converting values to standard relational tables and sorting alphabetical strings",
          "By executing sequential comparisons of every item in memory",
          "By caching previous SQL command transcripts"
        ],
        correctAnswer: 0
      },
      {
        question: "In global low-latency deployments, how is writing database state handled across active-active multi-region databases?",
        options: [
          "Via Conflict-Free Replicated Data Types (CRDTs) or Last-Write-Wins (LWW) resolution strategies",
          "By restricting write triggers to a single master server in Oregon and routing all global writes there",
          "By blocking all user writes during synchronization windows",
          "By running manual daily DB reconciliation scripts"
        ],
        correctAnswer: 0
      },
      {
        question: "Which pattern mitigates cascading failures across dependent microservices when a downstream dependency experiences high latency or outages?",
        options: [
          "Circuit Breaker Pattern to quickly fail fast and return fallback content instead of propagating blocks",
          "Aggressively increasing HTTP timeout thresholds to 60 seconds",
          "Auto-restarting the calling application on every failed network request",
          "Polling endpoints repeatedly with 10 millisecond intervals"
        ],
        correctAnswer: 0
      }
    ]
  },
  "Data Structures": {
    Entry: [
      {
        question: "What is the worst-case search time complexity of a standard Array structure of size N?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correctAnswer: 2
      },
      {
        question: "What structural principle defines a Stack's behavior?",
        options: [
          "FIFO (First In First Out)",
          "LIFO (Last In First Out)",
          "LILO (Last In Last Out)",
          "Random Access"
        ],
        correctAnswer: 1
      },
      {
        question: "Which data structure dynamically allocates memory nodes connected via pointer references?",
        options: ["Array", "Linked List", "Stack", "Tuple"],
        correctAnswer: 1
      },
      {
        question: "What is the primary lookup time complexity of a Hash Table under average conditions?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        correctAnswer: 0
      },
      {
        question: "In a binary tree, what is a node that does not have any child nodes called?",
        options: ["Root node", "Inner node", "Leaf node", "Internal node"],
        correctAnswer: 2
      }
    ],
    Mid: [
      {
        question: "What is the main advantage of a Binary Search Tree (BST) over a standard Linked List?",
        options: [
          "BST requires less physical storage space than Linked Lists",
          "On average, BST offers O(log N) search, insertion, and deletion times compared to O(N) for Lists",
          "BST preserves chronological entry order of items",
          "BST supports direct indexing"
        ],
        correctAnswer: 1
      },
      {
        question: "Which tree structure automatically performs balancing adjustments during insertions to maintain O(log N) heights?",
        options: ["Trie", "AVL Tree (or Red-Black Tree)", "Binary Heap", "B+ Tree"],
        correctAnswer: 1
      },
      {
        question: "How does a Trie (Prefix Tree) optimize search performance for dictionary spellcheck programs?",
        options: [
          "By storing items in sorting arrays",
          "By sharing common character prefixes along node paths to speed up prefix matches to O(Len of Search Key)",
          "By encrypting the letters to prevent parsing overhead",
          "By converting words to numerical binary representations"
        ],
        correctAnswer: 1
      },
      {
        question: "When represents a Min-Heap data structure?",
        options: [
          "A complete binary tree where the key of any parent node is less than or equal to its children keys",
          "An array sorted in descending order",
          "A hash index structure mapped to linear buckets",
          "A stack linked with double pointers"
        ],
        correctAnswer: 0
      },
      {
        question: "When representing sparse graphs with slow edge additions, which structural format is preferred?",
        options: ["Adjacency Matrix", "Adjacency List", "Complete Array list", "BST Map"],
        correctAnswer: 1
      }
    ],
    Senior: [
      {
        question: "Which advanced data structure handles dynamic connectivity queries and merges sets in amortized O(alpha(N)) almost-constant time?",
        options: ["Disjoint Set Union (DSU) / Union-Find with path compression", "Segment Tree", "Suffix Tree", "Fibonacci Heap"],
        correctAnswer: 0
      },
      {
        question: "How does a Bloom Filter verify element membership in a collection without retrieving the items?",
        options: [
          "By using multiple hash functions to set bits in an array, returning false positives but never false negatives",
          "By compiling the elements into a balanced red-black tree layout in temporary memory",
          "By running linear binary search iterations",
          "By storing MD5 hashes in a SQL database table"
        ],
        correctAnswer: 0
      },
      {
        question: "When executing range minimum queries (RMQ) on static arrays with O(1) retrieval times, what data structure is ideal?",
        options: ["Sparse Table with pre-computed powers of 2", "Segment Tree", "Fenwick Tree (Binary Indexed Tree)", "Self-Balancing BST"],
        correctAnswer: 0
      },
      {
        question: "What is the key structural benefit of a skip list over standard balanced BST trees in concurrent applications?",
        options: [
          "Skip lists have simpler lock-free or fine-grained concurrent insertions because only local pointers require updates",
          "Skip lists have strict O(1) worst-case search speeds",
          "Skip lists work without requiring pointer properties",
          "Skip lists require zero allocation actions"
        ],
        correctAnswer: 0
      },
      {
        question: "Which tree structure with dynamic fan-out is specifically optimized for database block storage systems to reduce disk reads?",
        options: ["B+ Tree (due to high branch factor and contiguous leaf elements page mapping)", "Trie", "Heap", "Interval Tree"],
        correctAnswer: 0
      }
    ]
  },
  Algorithms: {
    Entry: [
      {
        question: "What is the worst-case sorting time complexity of Bubble Sort?",
        options: ["O(log N)", "O(N)", "O(N log N)", "O(N^2)"],
        correctAnswer: 3
      },
      {
        question: "Dynamic programming works by dividing a complex problem into simpler subproblems and utilizing which technique?",
        options: [
          "Deleting variables after single iterations",
          "Memoization or storing pre-calculated values to avoid duplicate operations",
          "Sorting the input structures chronologically first",
          "Converting decimal variables into binary sets"
        ],
        correctAnswer: 1
      },
      {
        question: "What sorting algorithm is typically used in JavaScript's built-in array sort under the hood (e.g., Timsort)?",
        options: ["Quick Sort", "Merge Sort", "Insertion Sort & Merge Sort hybrid (Timsort)", "Selection Sort"],
        correctAnswer: 2
      },
      {
        question: "What is the search time complexity of Binary Search on a sorted array?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N^2)"],
        correctAnswer: 1
      },
      {
        question: "Which traversals process binary tree nodes level-by-level?",
        options: ["Pre-order traversal", "In-order traversal", "Breadth-First Search (BFS)", "Post-order traversal"],
        correctAnswer: 2
      }
    ],
    Mid: [
      {
        question: "How does Dijkstra's algorithm locate the shortest path in a weighted graph?",
        options: [
          "By sequentially reviewing paths in pre-order hierarchy",
          "By employing a greedy strategy using a priority queue to iteratively extract the closest unvisited node",
          "By checking random permutations of vertex connections",
          "By storing the graph in a balanced binary search tree"
        ],
        correctAnswer: 1
      },
      {
        question: "What representing the key difference between greedy algorithms and dynamic programming?",
        options: [
          "Greedy algorithms make optimal local choices at each step; DP makes decisions based on solving and caching subproblems",
          "Greedy algorithms are only compatible with arrays",
          "DP algorithms require dual recursive systems on multi-threaded machines",
          "No logical difference exists between their operational constraints"
        ],
        correctAnswer: 0
      },
      {
        question: "What is the best average-case performance scenario of Quick Sort when selecting a healthy pivot?",
        options: ["O(N)", "O(N log N)", "O(N^2)", "O(2^N)"],
        correctAnswer: 1
      },
      {
        question: "Which string search algorithm uses pre-calculated pattern shifts to avoid backtracking?",
        options: ["Depth-First Search", "KMP (Knuth-Morris-Pratt)", "Dijkstra string parser", "Binary character indexing"],
        correctAnswer: 1
      },
      {
        question: "Why would you choose Floyd-Warshall over Dijkstra algorithm under specific constraints?",
        options: [
          "Dijkstra is slower for single source graphs",
          "Floyd-Warshall solves all-pairs shortest paths and works with negative weights, whereas original Dijkstra is single-source and fails on negative margins",
          "Floyd-Warshall is compatible with tree data structures",
          "There are no operational differences"
        ],
        correctAnswer: 1
      }
    ],
    Senior: [
      {
        question: "What is the time complexity to solve the Longest Common Subsequence (LCS) problem of two strings of size N and M using optimal DP?",
        options: ["O(N + M)", "O(N * M)", "O(min(N, M))", "O(2^(N+M))"],
        correctAnswer: 1
      },
      {
        question: "Which algorithm detects strongly connected components (SCC) in a directed graph using two depth-first searches (DFS)?",
        options: ["Tarjan's Algorithm", "Kosaraju's Algorithm", "Kruskal's Algorithm", "Prim's Algorithm"],
        correctAnswer: 1
      },
      {
        question: "What is the time complexity of the Ford-Fulkerson algorithm for finding the maximum flow in a network?",
        options: ["O(E * max_flow)", "O(V^3)", "O(V^2 * E)", "O(E log V)"],
        correctAnswer: 0
      },
      {
        question: "Which heuristic search algorithm combines Best-First search and Dijkstra's cost paths to find optimal paths efficiently?",
        options: ["A* Search Algorithm", "Bellman-Ford", "Floyd-Warshall", "Suffix traversal"],
        correctAnswer: 0
      },
      {
        question: "Under what conditions will the Bellman-Ford shortest-path algorithm outperform Dijkstra?",
        options: [
          "When the graph contains negative weight edges, as Bellman-Ford can handle them and detect negative cycles",
          "When the graph is extremely dense with positive weight edges only",
          "When the graph is completely acyclic and unweighted",
          "When the graph uses adjacency list structures exclusively"
        ],
        correctAnswer: 0
      }
    ]
  }
};

export function getFallbackQuiz(category: string, difficulty: string): QuizSet {
  const normCategory = category || "Frontend";
  const normDifficulty = difficulty || "Mid";
  
  const catSet = fallbacks[normCategory] || fallbacks["Frontend"];
  const diffSet = catSet[normDifficulty] || catSet["Mid"];
  
  return {
    questions: diffSet
  };
}
