export const metadata = {
  title: "Event App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
