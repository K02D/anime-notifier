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

export function AiringAnimeSchedule() {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<number>>(new Set());

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

  const handleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      setUser(user);
      // Here you would typically fetch the user's subscriptions from your backend
      // and update the subscriptions state
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

  const formatBroadcastTime = (day: string, time: string, timezone: string) => {
    if (!day || !time) return "Broadcast time unknown";
    const date = new Date(`2023-01-01 ${time} ${timezone}`);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
      timeZone: "America/New_York",
      timeZoneName: "short",
    };
    return date.toLocaleString("en-US", options);
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
                <Skeleton className="h-[200px] w-full mb-2" />
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
                className="w-full h-[200px] object-cover rounded-md mb-2"
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
                    <BellOff size={16} />
                  ) : (
                    <Bell size={16} />
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
