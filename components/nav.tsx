// ../components/nav.tsx
import Link from 'next/link';
import axios from 'axios';
import { useState, useEffect, useCallback } from "react";
import { supabase } from '../lib/supabaseClient';
import { Session } from "@supabase/supabase-js";
import { useMyVariable } from '../context/MyVariableContext';
import { saveUser } from '../utils/saveUser';
import { fetchLatestTag } from '../utils/fetchLatestTag';
import styles from '../styles/nav.module.css';

type RoleData = {
  roles: {
    [key: string]: string;
  };
  userRoles: string[];
  isAdmin: boolean;  
  discordRoles: string[];
  appRole: string;
};

const Nav = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const { setMyVariable } = useMyVariable(); // Removed unused myVariable
  const [latestTag, setLatestTag] = useState<string>('');
  
  async function getTags() {
    const tag = await fetchLatestTag();
    setLatestTag(tag);
  }

  useEffect(() => {
    getTags();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setMyVariable(prevState => ({
        ...prevState,
        isLoggedIn: !!session 
      }));
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setMyVariable(prevState => ({
        ...prevState,
        isLoggedIn: !!session 
      }));
    })
    
    return () => subscription.unsubscribe()
  }, [setMyVariable]) // Added setMyVariable to dependency array

  async function signInWithDiscord() {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'https://archive-oracle.netlify.app/submit-meeting-summary',
      },
    })
  }

  async function signout() {
    await supabase.auth.signOut()
  }

  // Memoize saveUsername to prevent unnecessary recreations
  const saveUsernameCallback = useCallback(async () => {
    await saveUser(session?.user.user_metadata);
  }, [session?.user.user_metadata]);

  useEffect(() => {
    // Guard clause: return if session is null
    if (!session) return;

    saveUsernameCallback();
    const userId = session.user.id;
    
    axios.get(`/api/userRoles?userId=${userId}`)
      .then(response => {
        if (response.status !== 200) {
          throw new Error('Network response was not ok');
        }
        setMyVariable(prevState => ({
          ...prevState,
          roles: response.data,
          currentUser: session?.user.user_metadata?.full_name
        }));
        setRoleData(prevState => {
          if (prevState) {
            return {
              roles: prevState.roles,
              userRoles: prevState.userRoles,
              isAdmin: response.data.isAdmin,
              discordRoles: response.data.discordRoles,
              appRole: response.data.appRole
            };
          } else {
            // Assuming default values for roles and userRoles
            return {
              roles: {},
              userRoles: [],
              isAdmin: response.data.isAdmin,
              discordRoles: response.data.discordRoles,
              appRole: response.data.appRole
            };
          }
        });
      })
      .catch(error => console.error('Error:', error));
  }, [session, setMyVariable, saveUsernameCallback]); // Added missing dependencies

  return (
    <nav className={styles.routes}>
      <div className={styles.navLeft}>
        <Link href="/" className={styles.navitems}>
          Home
        </Link>
        {roleData?.appRole === "admin" && (
          <Link href='/admin-tools' className={styles.navitems}>
            Admin Tools
          </Link>
        )}
      </div>
      <div>{latestTag}</div>
      <div>
        {!session && (
          <button onClick={signInWithDiscord} className={styles.navitems}>
            Sign In with Discord
          </button>
        )}
        {session && (
          <button onClick={signout} className={styles.navitems}>
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
};

export default Nav;