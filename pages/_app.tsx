// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Nav from '../components/nav';
import { GlobalMeetingSummariesProvider } from '../context/GlobalMeetingSummariesContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GlobalMeetingSummariesProvider>
        <div className="mainLayout">
          <Nav />
          <div className="pageContent">
            <Component {...pageProps} />
          </div>
        </div>
    </GlobalMeetingSummariesProvider>
  );
}

export default MyApp;