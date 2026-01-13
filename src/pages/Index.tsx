import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowUpDown, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GameGrid } from "@/components/games/GameGrid";
import { useGames } from "@/hooks/useGames";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "title" | "difficulty" | "playtime" | "newest";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: games = [], isLoading } = useGames();

  const filter = searchParams.get("filter");
  const filterValue = searchParams.get("value");
  const searchQuery = searchParams.get("search");
  const sortBy = (searchParams.get("sort") as SortOption) || "title";

  // Filter games
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query)
      );
    }

    // Category filters
    if (filter && filterValue) {
      switch (filter) {
        case "difficulty":
          result = result.filter((g) => g.difficulty === filterValue);
          break;
        case "type":
          result = result.filter((g) => g.game_type === filterValue);
          break;
        case "playtime":
          result = result.filter((g) => g.play_time === filterValue);
          break;
        case "mechanic":
          result = result.filter((g) =>
            g.mechanics.some((m) => m.name === filterValue)
          );
          break;
        case "publisher":
          result = result.filter((g) => g.publisher?.name === filterValue);
          break;
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "difficulty":
          return (a.difficulty ?? "").localeCompare(b.difficulty ?? "");
        case "playtime":
          return (a.play_time ?? "").localeCompare(b.play_time ?? "");
        case "newest": {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        }
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [games, filter, filterValue, searchQuery, sortBy]);

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "title") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", value);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = filter || searchQuery;

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              {filter && filterValue
                ? filterValue
                : searchQuery
                ? `Search: "${searchQuery}"`
                : "Game Collection"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredGames.length} {filteredGames.length === 1 ? "game" : "games"} in collection
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40 bg-card">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="playtime">Play Time</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {filter && filterValue && (
              <Badge variant="secondary" className="gap-1">
                {filter}: {filterValue}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                search: {searchQuery}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Game Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <GameGrid games={filteredGames} />
      )}
    </Layout>
  );
};

export default Index;
