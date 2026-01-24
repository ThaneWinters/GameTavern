import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameRating, useRateGame, useRemoveRating } from "@/hooks/useGameRatings";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StarRatingProps {
  gameId: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  interactive?: boolean;
  className?: string;
}

export function StarRating({
  gameId,
  size = "md",
  showCount = true,
  interactive = true,
  className,
}: StarRatingProps) {
  const { ratings } = useFeatureFlags();
  const { averageRating, ratingCount, userRating } = useGameRating(gameId);
  const rateGame = useRateGame();
  const removeRating = useRemoveRating();
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Feature flag check
  if (!ratings) return null;

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const displayRating = hoverRating ?? userRating ?? averageRating;

  const handleClick = (rating: number) => {
    if (!interactive) return;
    
    // If clicking the same star as current rating, remove it
    if (userRating === rating) {
      removeRating.mutate(gameId);
    } else {
      rateGame.mutate({ gameId, rating });
    }
  };

  const stars = [1, 2, 3, 4, 5].map((star) => {
    const filled = star <= displayRating;
    const halfFilled = !filled && star - 0.5 <= displayRating;
    const isUserRated = userRating !== null && star <= userRating;

    return (
      <button
        key={star}
        type="button"
        disabled={!interactive || rateGame.isPending || removeRating.isPending}
        onClick={() => handleClick(star)}
        onMouseEnter={() => interactive && setHoverRating(star)}
        onMouseLeave={() => setHoverRating(null)}
        className={cn(
          "transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm",
          interactive && "hover:scale-110 cursor-pointer",
          !interactive && "cursor-default"
        )}
        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
      >
        <Star
          className={cn(
            sizeClasses[size],
            "transition-colors",
            filled || halfFilled
              ? isUserRated || hoverRating
                ? "fill-primary text-primary"
                : "fill-primary/80 text-primary/80"
              : "text-muted-foreground/40"
          )}
        />
      </button>
    );
  });

  const ratingDisplay = (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">{stars}</div>
      {showCount && ratingCount > 0 && (
        <span className="text-sm text-muted-foreground ml-1">
          ({averageRating.toFixed(1)} · {ratingCount})
        </span>
      )}
    </div>
  );

  if (!interactive) {
    return ratingDisplay;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{ratingDisplay}</div>
      </TooltipTrigger>
      <TooltipContent>
        {userRating
          ? `Your rating: ${userRating} star${userRating > 1 ? "s" : ""}. Click to change.`
          : "Click to rate this game"}
      </TooltipContent>
    </Tooltip>
  );
}
