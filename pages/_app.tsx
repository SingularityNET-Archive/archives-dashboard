// _app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Nav from '../components/nav';
import { MyVariableProvider } from '../context/MyVariableContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MyVariableProvider>
      <div className="mainLayout">
        <Nav />
        <div className="pageContent">
          <Component {...pageProps} />
        </div>
      </div>
    </MyVariableProvider>
  );
}

export default MyApp;