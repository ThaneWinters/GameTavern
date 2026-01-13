import { GameCard } from "./GameCard";
import type { GameWithRelations } from "@/types/game";

interface GameGridProps {
  games: GameWithRelations[];
}

export function GameGrid({ games }: GameGridProps) {
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-6xl mb-4">🎲</span>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          No games found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or add some games to your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {games.map((game, index) => (
        <div
          key={game.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <GameCard game={game} />
        </div>
      ))}
    </div>
  );
}
