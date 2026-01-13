import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Clock, Calendar, ExternalLink, Edit } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useGame } from "@/hooks/useGames";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: game, isLoading } = useGame(id);
  const { isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-6xl mb-4">🎲</span>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
            Game not found
          </h2>
          <p className="text-muted-foreground mb-4">
            The game you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/")}>Back to Collection</Button>
        </div>
      </Layout>
    );
  }

  const playerRange =
    game.min_players === game.max_players
      ? `${game.min_players} player${game.min_players > 1 ? "s" : ""}`
      : `${game.min_players}-${game.max_players} players`;

  const allCategories = [
    { label: game.difficulty, type: "difficulty" },
    { label: game.play_time, type: "playtime" },
    { label: game.game_type, type: "type" },
    ...game.mechanics.map((m) => ({ label: m.name, type: "mechanic" })),
    ...(game.publisher ? [{ label: game.publisher.name, type: "publisher" }] : []),
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted card-elevated">
              {game.image_url ? (
                <img
                  src={game.image_url}
                  alt={game.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <span className="text-8xl text-muted-foreground/50">🎲</span>
                </div>
              )}
            </div>

            {/* Additional Images */}
            {game.additional_images && game.additional_images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {game.additional_images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <img
                      src={img}
                      alt={`${game.title} - Image ${idx + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl font-bold text-foreground">
                {game.title}
              </h1>
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/edit/${game.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4">
              {allCategories.map((cat, idx) => (
                <Link
                  key={idx}
                  to={`/?filter=${cat.type}&value=${encodeURIComponent(cat.label)}`}
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {cat.label}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* BGG Link */}
            {game.bgg_url && (
              <a
                href={game.bgg_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline"
              >
                View on BoardGameGeek
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* Tabs */}
            <Tabs defaultValue="description" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="info">Additional Info</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <div className="prose prose-sm max-w-none text-foreground">
                  <h2 className="font-display text-xl font-semibold mb-3">
                    Description
                  </h2>
                  {game.description ? (
                    <div
                      className="text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: game.description }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description available.
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">
                    Additional Information
                  </h2>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Play Time
                      </span>
                      <span className="font-medium">{game.play_time}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Number of Players
                      </span>
                      <span className="font-medium">{playerRange}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Suggested Age</span>
                      <span className="font-medium">{game.suggested_age}</span>
                    </div>
                    {game.publisher && (
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Publisher</span>
                        <span className="font-medium">{game.publisher.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GameDetail;
