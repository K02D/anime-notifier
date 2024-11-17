"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import {
  signInWithGoogle,
  subscribeToAnime,
  unsubscribeFromAnime,
} from "./auth-and-notifications";
import { User } from "firebase/auth";

type Anime = {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  broadcast: { day: string; time: string; timezone: string };
  score: number;
};

const TOKYO_TIMEZONE = "Asia/Tokyo";
const DAYS_OF_WEEK = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

const getTimezoneOffset = () => {
  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Create a date object for current time
  const now = new Date();

  // Calculate offset between user's timezone and Tokyo
  const tokyoOffset = new Date(
    now.toLocaleString("en-US", { timeZone: TOKYO_TIMEZONE })
  ).getTime();
  const userOffset = new Date(
    now.toLocaleString("en-US", { timeZone: userTimezone })
  ).getTime();

  // Return difference in hours
  return (tokyoOffset - userOffset) / (1000 * 60 * 60);
};

export function AiringAnimeSchedule() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<number>>(new Set());
  const [userTimezone, setUserTimezone] = useState<string>("");

  useEffect(() => {
    // Set user's timezone on component mount
    setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const response = await fetch("https://api.jikan.moe/v4/seasons/now");
        if (!response.ok) {
          throw new Error("Failed to fetch anime data");
        }
        const data = await response.json();
        setAnimeList(data.data);
        setIsLoading(false);
      } catch (err) {
        setError("An error occurred while fetching anime data");
        setIsLoading(false);
      }
    };

    fetchAnime();
  }, []);

  const formatBroadcastTime = (day: string, time: string, timezone: string) => {
    if (!day || !time || !timezone) {
      return "N/A";
    }

    try {
      const [hours, minutes] = time.split(":").map(Number);
      const offset = getTimezoneOffset();

      // Calculate local time by subtracting the offset
      let localHours = hours - offset;

      // Adjust day if time crosses day boundary
      let adjustedDay = day;
      if (localHours < 0) {
        localHours += 24;
        const currentDayIndex = DAYS_OF_WEEK.indexOf(day);
        const previousDayIndex = (currentDayIndex - 1 + 7) % 7;
        adjustedDay = DAYS_OF_WEEK[previousDayIndex];
      } else if (localHours >= 24) {
        localHours -= 24;
        const currentDayIndex = DAYS_OF_WEEK.indexOf(day);
        const nextDayIndex = (currentDayIndex + 1) % 7;
        adjustedDay = DAYS_OF_WEEK[nextDayIndex];
      }

      // Format to 12-hour time
      const period = localHours >= 12 ? "PM" : "AM";
      const hours12 = localHours % 12 || 12;
      const formattedTime = `${hours12}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;

      return `${adjustedDay}, ${formattedTime} (${userTimezone})`;
    } catch (error) {
      console.error("Error formatting broadcast time:", error);
      return "Time conversion error";
    }
  };

  const handleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      setUser(user);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSubscribe = async (
    animeId: number,
    animeTitle: string,
    broadcastTime: string
  ) => {
    if (!user) return;
    try {
      await subscribeToAnime(user.uid, animeId, animeTitle, broadcastTime);
      setSubscriptions(new Set(subscriptions).add(animeId));
    } catch (error) {
      console.error("Subscription failed", error);
    }
  };

  const handleUnsubscribe = async (animeId: number) => {
    if (!user) return;
    try {
      await unsubscribeFromAnime(user.uid, animeId);
      const newSubscriptions = new Set(subscriptions);
      newSubscriptions.delete(animeId);
      setSubscriptions(newSubscriptions);
    } catch (error) {
      console.error("Unsubscription failed", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Currently Airing Anime</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Currently Airing Anime</h1>
        {user ? (
          <p>Welcome, {user.displayName}</p>
        ) : (
          <Button onClick={handleLogin}>Login with Google</Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {animeList.map((anime) => (
          <Card key={anime.mal_id}>
            <CardHeader>
              <CardTitle className="text-lg">{anime.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={anime.images.jpg.image_url}
                alt={anime.title}
                className="w-full h-48 object-cover rounded-md mb-2"
              />
              <p className="text-sm text-muted-foreground mb-2">
                Airs:{" "}
                {formatBroadcastTime(
                  anime.broadcast.day,
                  anime.broadcast.time,
                  anime.broadcast.timezone
                )}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Rating: {anime.score ? anime.score.toFixed(2) : "N/A"}
              </p>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    subscriptions.has(anime.mal_id)
                      ? handleUnsubscribe(anime.mal_id)
                      : handleSubscribe(
                          anime.mal_id,
                          anime.title,
                          formatBroadcastTime(
                            anime.broadcast.day,
                            anime.broadcast.time,
                            anime.broadcast.timezone
                          )
                        )
                  }
                >
                  {subscriptions.has(anime.mal_id) ? (
                    <BellOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  {subscriptions.has(anime.mal_id)
                    ? "Unsubscribe"
                    : "Subscribe"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
