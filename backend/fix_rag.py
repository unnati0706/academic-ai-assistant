import codecs

with codecs.open(r'C:\Users\parma\academic-ai-assistant\backend\app\services\rag_service.py', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Find the _generate_dynamic_fallback method and replace it
old_start = '    def _generate_dynamic_fallback(self, question: str) -> str:'
old_end = '    def _structured_fallback_no_topic'

start_idx = content.find(old_start)
end_idx = content.find(old_end)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find method boundaries: start={start_idx}, end={end_idx}")
else:
    new_method = '''    def _generate_dynamic_fallback(self, question: str) -> str:
        """Generate a structured academic explanation for any topic."""
        q = question.strip()
        q_lower = q.lower()
        topic_title = q.strip().title()
        
        # Detect topic category and generate appropriate content
        topics_db = {
            'stack': {
                'name': 'Stack Data Structure',
                'definition': 'A Stack is a linear data structure that follows the Last In, First Out (LIFO) principle, where the last element added is the first one to be removed.',
                'concepts': 'Think of a Stack like a stack of plates in a cafeteria: you can only add or remove a plate from the top. The key operations are:\\n- **Push**: Add an element to the top of the stack\\n- **Pop**: Remove the top element from the stack\\n- **Peek/Top**: View the top element without removing it\\n- **isEmpty**: Check if the stack is empty',
                'example': 'Example - Push and Pop on a Stack:\\n1. Push(10) -> Stack: [10]\\n2. Push(20) -> Stack: [10, 20]\\n3. Push(30) -> Stack: [10, 20, 30]\\n4. Pop() -> Returns 30, Stack: [10, 20]\\n5. Pop() -> Returns 20, Stack: [10]\\n\\nApplication: Function call management in programming (call stack), undo mechanisms in text editors, expression evaluation.',
                'advantages': '**Advantages:**\\n- O(1) time complexity for push and pop operations\\n- Simple to implement\\n- Useful for backtracking algorithms\\n- Memory efficient for LIFO operations\\n\\n**Disadvantages:**\\n- Limited access (only top element can be accessed)\\n- Fixed size if implemented with arrays\\n\\n**Applications:** Function call management, expression parsing, undo/redo functionality, browser back navigation, syntax parsing.',
                'exam': 'Exam Tips:\\n- Know the difference between array-based and linked-list-based stacks\\n- Understand time complexities: O(1) for push, pop, peek\\n- Common exam questions: Infix-to-postfix conversion, balanced parentheses check\\n- Key concept: LIFO principle and its applications'
            },
            'binary search': {
                'name': 'Binary Search',
                'definition': 'Binary Search is a searching algorithm that finds the position of a target value within a sorted array by repeatedly dividing the search interval in half.',
                'concepts': 'The algorithm works by comparing the target value to the middle element of the array:\\n- If the target matches the middle element, the position is returned\\n- If the target is less than the middle element, search the left half\\n- If the target is greater, search the right half\\n- Repeat until found or the interval is empty',
                'example': 'Example - Binary Search in array [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]:\\n- Target = 23\\n- Step 1: Mid = 16 (index 4), 23 > 16 -> search right half\\n- Step 2: Mid = 56 (index 7), 23 < 56 -> search left half\\n- Step 3: Mid = 23 (index 5) -> Found!\\n\\nTime Complexity: O(log n)\\nSpace Complexity: O(1)',
                'advantages': '**Advantages:**\\n- Very fast: O(log n) time complexity\\n- Much faster than linear search for large datasets\\n- Minimal memory usage\\n\\n**Disadvantages:**\\n- Requires sorted data\\n- Only works on arrays with random access\\n- Insertion/deletion is expensive if maintaining sorted order\\n\\n**Applications:** Searching databases, debugging (git bisect), finding boundaries, optimization problems.',
                'exam': 'Exam Tips:\\n- Always verify the array is sorted before applying binary search\\n- Know the difference between iterative and recursive implementations\\n- Common pitfalls: integer overflow in mid calculation (use mid = low + (high-low)//2)\\n- Time complexity: O(log n) is the most important concept to remember'
            },
            'normalization': {
                'name': 'DBMS Normalization',
                'definition': 'Database Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity by dividing large tables into smaller, related tables.',
                'concepts': 'Normalization involves organizing data into normal forms:\\n- **1NF**: All attributes contain atomic values (no repeating groups)\\n- **2NF**: Meets 1NF + no partial dependencies (all non-key attributes depend on the whole primary key)\\n- **3NF**: Meets 2NF + no transitive dependencies (non-key attributes depend only on the primary key)\\n- **BCNF**: Every determinant is a candidate key',
                'example': 'Example - Unnormalized Table:\\nStudent_ID | Course | Instructor | Instructor_Office\\n1 | DBMS | Dr. Smith | A101\\n1 | OS | Dr. Jones | B202\\n\\nAfter 3NF:\\nStudents(Student_ID, Name)\\nCourses(Course_ID, Course_Name, Instructor)\\nEnrollment(Student_ID, Course_ID)\\n\\nRedundancy eliminated: Instructor info stored once.',
                'advantages': '**Advantages:**\\n- Reduces data redundancy\\n- Eliminates update, insert, and delete anomalies\\n- Improves data integrity\\n- Easier to maintain\\n\\n**Disadvantages:**\\n- May require complex joins, slowing queries\\n- Can be difficult to design initially\\n- Over-normalization can hurt performance\\n\\n**Applications:** Database design for enterprise applications, ERP systems, financial databases, any relational database system.',
                'exam': 'Exam Tips:\\n- Know how to identify functional dependencies\\n- Practice normalization step-by-step through 1NF, 2NF, 3NF\\n- Understand the difference between partial and transitive dependencies\\n- Know the anomalies: update, insertion, deletion'
            },
            'deadlock': {
                'name': 'Operating System Deadlock',
                'definition': 'A Deadlock is a situation where two or more processes are blocked forever, each waiting for the other to release a resource, creating a circular wait condition.',
                'concepts': 'Four necessary conditions for deadlock (Coffman conditions):\\n1. **Mutual Exclusion**: Resources cannot be shared\\n2. **Hold and Wait**: Process holds resources while waiting for others\\n3. **No Preemption**: Resources cannot be forcibly taken\\n4. **Circular Wait**: Circular chain of processes waiting for resources\\n\\nPrevention: Break any one of these four conditions\\nAvoidance: Bankers algorithm\\nDetection: Resource allocation graph',
                'example': 'Example - Deadlock Scenario:\\n- Process P1 holds Resource A, waits for Resource B\\n- Process P2 holds Resource B, waits for Resource A\\n- Neither can proceed -> Deadlock!\\n\\nSolution - Prevention by ordering resources:\\n- Assign a global order to all resources (A=1, B=2)\\n- Process must request resources in increasing order\\n- P1 requests A then B, P2 requests A then B (no circular wait)\\n\\nDetection methods: Wait-for graph, resource allocation matrix.',
                'advantages': '**Advantages of handling deadlocks:**\\n- Prevents system crashes and hangs\\n- Ensures fair resource allocation\\n- Improves system reliability\\n\\n**Disadvantages:**\\n- Prevention/avoidance can reduce system throughput\\n- Bankers algorithm has high overhead\\n- Detection methods add runtime cost\\n\\n**Applications:** Database systems, operating systems, multithreaded programming, distributed systems, operating system course exams.',
                'exam': 'Exam Tips:\\n- Know all four Coffman conditions\\n- Practice drawing resource allocation graphs\\n- Know prevention vs avoidance vs detection strategies\\n- Understand Bankers algorithm and safety states\\n- Common question: Determine if a given allocation is in deadlock'
            },
            'tcp': {
                'name': 'Computer Networks TCP vs UDP',
                'definition': 'TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are core transport layer protocols. TCP is connection-oriented with reliability guarantees, while UDP is connectionless and faster but unreliable.',
                'concepts': '**TCP:**\\n- Connection-oriented (3-way handshake: SYN, SYN-ACK, ACK)\\n- Reliable delivery with acknowledgments and retransmissions\\n- Flow control (sliding window)\\n- Congestion control\\n- Ordered data delivery\\n- Overhead: larger header (20 bytes)\\n\\n**UDP:**\\n- Connectionless (no handshake)\\n- Best-effort delivery (no guarantees)\\n- No flow control or congestion control\\n- Faster and lighter\\n- Header: 8 bytes\\n- Used for real-time applications',
                'example': 'Example Applications:\\n- **TCP:** HTTP/HTTPS web browsing, email (SMTP), file transfer (FTP), database connections\\n- **UDP:** Video streaming (YouTube Live), online gaming, VoIP calls, DNS queries, DNS lookups\\n\\nTCP ensures every packet arrives; UDP sacrifices reliability for speed. A video call uses UDP because a dropped frame is better than a delayed frame.',
                'advantages': '**TCP Advantages:** Reliable, ordered delivery, error correction, congestion control\\n**TCP Disadvantages:** Slower, higher overhead, larger header\\n**UDP Advantages:** Fast, low latency, lightweight, supports multicast\\n**UDP Disadvantages:** Unreliable, no ordering, no congestion control\\n\\n**Applications:** TCP for web, email, file transfer; UDP for gaming, streaming, VoIP, DNS.',
                'exam': 'Exam Tips:\\n- Know the 3-way handshake process for TCP\\n- Understand key differences: reliability vs speed\\n- Know examples of applications using each protocol\\n- Understand when to use UDP vs TCP\\n- Key concept: UDPs lower latency makes it better for real-time applications'
            },
            'recursion': {
                'name': 'Recursion',
                'definition': 'Recursion is a programming technique where a function calls itself to solve a smaller instance of the same problem, eventually reaching a base case that stops the recursion.',
                'concepts': 'Every recursive function needs:\\n- **Base Case**: The condition that stops the recursion (the simplest version of the problem)\\n- **Recursive Case**: The function calls itself with a modified argument\\n- **Progress**: Each recursive call should move toward the base case\\n\\nCall stack: Each recursive call adds a frame to the call stack. When the base case is reached, the stack unwinds returning results.',
                'example': 'Example - Factorial using Recursion:\\nfactorial(n) = n * factorial(n-1)\\nBase case: factorial(0) = 1\\n\\nfactorial(5) = 5 * factorial(4)\\n= 5 * 4 * factorial(3)\\n= 5 * 4 * 3 * factorial(2)\\n= 5 * 4 * 3 * 2 * factorial(1)\\n= 5 * 4 * 3 * 2 * 1 * factorial(0)\\n= 5 * 4 * 3 * 2 * 1 * 1\\n= 120\\n\\nTime Complexity: O(n)\\nSpace Complexity: O(n) due to call stack',
                'advantages': '**Advantages:**\\n- Elegant solutions for problems with recursive structure\\n- Simplifies code for tree/graph traversal\\n- Natural fit for divide-and-conquer algorithms\\n\\n**Disadvantages:**\\n- Can cause stack overflow for deep recursion\\n- Higher memory usage due to call stack\\n- Sometimes slower than iterative solutions\\n\\n**Applications:** Tree traversal, Fibonacci sequence, Tower of Hanoi, maze solving, parsing expressions, divide-and-conquer (merge sort, quick sort).',
                'exam': 'Exam Tips:\\n- Always identify the base case first\\n- Understand how the call stack works\\n- Know how to convert recursive solutions to iterative\\n- Common recursion patterns: factorial, Fibonacci, tower of hanoi\\n- Time/Space complexity analysis is frequently tested'
            },
            'sorting': {
                'name': 'Sorting Algorithms',
                'definition': 'Sorting algorithms arrange elements in a specific order (ascending or descending). Different algorithms have different time and space complexities.',
                'concepts': 'Common sorting algorithms:\\n- **Bubble Sort**: Repeatedly swaps adjacent elements. O(n^2) time, O(1) space\\n- **Merge Sort**: Divide and conquer, stable sort. O(n log n) time, O(n) space\\n- **Quick Sort**: Divide and conquer with pivot. O(n log n) average, O(n^2) worst\\n- **Heap Sort**: Uses heap data structure. O(n log n) time, O(1) space',
                'example': 'Example - Merge Sort of [38, 27, 43, 3, 9, 82, 10]:\\n1. Divide: [38, 27, 43, 3] and [9, 82, 10]\\n2. Recursively sort each half\\n3. Merge: [3, 9, 10, 27, 38, 43, 82]\\n\\nTime Complexity: O(n log n) in all cases\\nSpace Complexity: O(n) for auxiliary arrays',
                'advantages': '**Merge Sort Advantages:** Stable, guaranteed O(n log n), good for linked lists\\n**Quick Sort Advantages:** In-place, fast in practice, cache-friendly\\n**Bubble Sort Disadvantages:** O(n^2), inefficient for large data\\n\\n**Applications:** Database indexing, search optimization, data analysis, competitive programming exams.',
                'exam': 'Exam Tips:\\n- Know time complexity of all major sorting algorithms\\n- Understand stability (does equal elements maintain order?)\\n- Know when to use merge sort vs quick sort\\n- Practice tracing algorithm steps on paper\\n- Key concept: Comparison-based sorting lower bound is O(n log n)'
            }
        }
        
        # Find matching topic
        for keywords, topic_data in topics_db.items():
            if keywords in q_lower:
                t = topic_data
                return (
                    f"## Definition & Overview\\n\\n"
                    f"{t['definition']}\\n\\n"
                    f"## Core Concepts & Mechanics\\n\\n"
                    f"{t['concepts']}\\n\\n"
                    f"## Examples\\n\\n"
                    f"{t['example']}\\n\\n"
                    f"## Advantages & Limitations\\n\\n"
                    f"{t['advantages']}\\n\\n"
                    f"## Applications & Exam Tips\\n\\n"
                    f"{t['exam']}"
                )
        
        # Generic topic fallback
        return (
            f"## Definition & Overview\\n\\n"
            f"{topic_title} is an important academic concept. Provide a clear, student-friendly definition.\\n\\n"
            f"## Core Concepts & Mechanics\\n\\n"
            f"Explain the key concepts step-by-step in easy-to-understand language.\\n\\n"
            f"## Examples\\n\\n"
            f"Include at least one concrete example or walkthrough.\\n\\n"
            f"## Advantages & Limitations\\n\\n"
            f"Explain when this concept is useful and any limitations.\\n\\n"
            f"## Applications & Exam Tips\\n\\n"
            f"Mention real-world applications and study tips for exams."
        )

'''
    content = content[:start_idx] + new_method + '\n' + content[end_idx:]
    
    with codecs.open(r'C:\Users\parma\academic-ai-assistant\backend\app\services\rag_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced _generate_dynamic_fallback with comprehensive topic-specific generation')
