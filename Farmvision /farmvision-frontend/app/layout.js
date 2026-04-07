import "./globals.css";

export const metadata = {
  title: "FarmVision - Agriculture Dashboard",
  description: "Advanced crop management and yield prediction system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
