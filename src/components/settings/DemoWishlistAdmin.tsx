import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDemoMode } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";

export function DemoWishlistAdmin() {
  const { toast } = useToast();
  const { demoGames, demoWishlist, removeDemoWishlistVote, resetDemoData } = useDemoMode();

  // Build wishlist summary
  const summary = useMemo(() => {
    const gameVotes = new Map<string, { game_id: string; vote_count: number; named_votes: number; game_title: string; game_slug: string }>();
    
    demoWishlist.forEach((entry) => {
      const game = demoGames.find((g) => g.id === entry.gameId);
      const existing = gameVotes.get(entry.gameId);
      if (existing) {
        existing.vote_count += 1;
        if (entry.guestName) existing.named_votes += 1;
      } else {
        gameVotes.set(entry.gameId, {
          game_id: entry.gameId,
          vote_count: 1,
          named_votes: entry.guestName ? 1 : 0,
          game_title: game?.title || "Unknown Game",
          game_slug: game?.slug || entry.gameId,
        });
      }
    });
    
    return Array.from(gameVotes.values()).sort((a, b) => b.vote_count - a.vote_count);
  }, [demoWishlist, demoGames]);

  const entries = useMemo(() => {
    return demoWishlist.map((entry) => {
      const game = demoGames.find((g) => g.id === entry.gameId);
      return {
        id: `${entry.gameId}-${entry.guestIdentifier}`,
        game_id: entry.gameId,
        guest_name: entry.guestName || null,
        guest_identifier: entry.guestIdentifier,
        created_at: entry.createdAt,
        game_title: game?.title || "Unknown Game",
        game_slug: game?.slug || entry.gameId,
      };
    });
  }, [demoWishlist, demoGames]);

  const totalVotes = demoWishlist.length;
  const gamesWithVotes = summary.length;
  const uniqueVoters = new Set(demoWishlist.map((e) => e.guestIdentifier)).size;

  const handleClearAllVotes = () => {
    // Reset only clears wishlist in context
    demoWishlist.forEach((entry) => {
      removeDemoWishlistVote(entry.gameId);
    });
    toast({
      title: "Votes cleared",
      description: "All demo wishlist votes have been removed.",
    });
  };

  const handleDeleteEntry = (gameId: string) => {
    removeDemoWishlistVote(gameId);
    toast({
      title: "Vote removed",
      description: "The wishlist vote has been removed.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Games with Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamesWithVotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Voters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVoters}</div>
          </CardContent>
        </Card>
      </div>

      {/* Most Wanted Games */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Most Wanted Games
            </CardTitle>
            <CardDescription>
              Games ranked by number of wishlist votes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {totalVotes > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Votes
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Votes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {totalVotes} wishlist votes. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllVotes}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No wishlist votes yet. Votes will appear here when guests vote for games.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead className="text-center">Total Votes</TableHead>
                  <TableHead className="text-center">Named Votes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((item, index) => (
                  <TableRow key={item.game_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        to={`/demo/game/${item.game_slug}`}
                        className="flex items-center gap-1 hover:underline text-primary"
                      >
                        {item.game_title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{item.vote_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.named_votes}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detailed Votes */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display">All Votes</CardTitle>
          <CardDescription>
            Detailed view of all wishlist votes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No votes recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>Voter Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Link
                        to={`/demo/game/${entry.game_slug}`}
                        className="hover:underline text-primary"
                      >
                        {entry.game_title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {entry.guest_name || (
                        <span className="text-muted-foreground italic">Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vote?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove this vote for "{entry.game_title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEntry(entry.game_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
