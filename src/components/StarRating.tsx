import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

export const StarRating = ({ rating, onRatingChange, disabled = false }: StarRatingProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onRatingChange(star)}
          disabled={disabled}
          className={cn(
            "transition-all",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
          )}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
};
