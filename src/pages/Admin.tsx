import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Shield, 
  Plus, 
  Upload, 
  LogOut, 
  Trash2, 
  Edit, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useGames, useDeleteGame } from "@/hooks/useGames";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const { data: games = [], isLoading: gamesLoading } = useGames();
  const deleteGame = useDeleteGame();
  const { toast } = useToast();

  const [bggUrl, setBggUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBGGImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bggUrl.trim()) return;

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("bgg-import", {
        body: { url: bggUrl },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Game imported!",
          description: `"${data.game.title}" has been added to your collection.`,
        });
        setBggUrl("");
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Could not import game from BoardGameGeek",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteGame.mutateAsync(id);
      toast({
        title: "Game deleted",
        description: `"${title}" has been removed from your collection.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete game",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Import Card */}
          <Card className="lg:col-span-1 card-elevated">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import from BGG
              </CardTitle>
              <CardDescription>
                Paste a BoardGameGeek game URL to import game data automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBGGImport} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bgg-url">BoardGameGeek URL</Label>
                  <Input
                    id="bgg-url"
                    type="url"
                    value={bggUrl}
                    onChange={(e) => setBggUrl(e.target.value)}
                    placeholder="https://boardgamegeek.com/boardgame/..."
                    disabled={isImporting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Game
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Add Game Card */}
          <Card className="lg:col-span-2 card-elevated">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Game
              </CardTitle>
              <CardDescription>
                Manually add a new game to your collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/admin/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Game Manually
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Games Table */}
        <Card className="mt-8 card-elevated">
          <CardHeader>
            <CardTitle className="font-display">
              Game Collection ({games.length})
            </CardTitle>
            <CardDescription>
              Manage your game library
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gamesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : games.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No games in your collection yet. Import or add one above!
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.title}</TableCell>
                      <TableCell>{game.game_type}</TableCell>
                      <TableCell>{game.difficulty}</TableCell>
                      <TableCell>
                        {game.min_players}-{game.max_players}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/edit/${game.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Game</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{game.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(game.id, game.title)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
