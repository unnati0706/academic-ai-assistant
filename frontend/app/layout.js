import "./globals.css";

export const metadata = {
  title: "AcademicAI - Academic Knowledge Management & RAG Assistant",
  description: "AI-powered academic resource portal, smart study material search, and RAG study assistant for students and faculty.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-gray-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
