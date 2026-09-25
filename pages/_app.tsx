// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Nav from '../components/nav';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="mainLayout">
      <Nav />
      <div className="pageContent">
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default MyApp;
