import { Star, ShoppingCart, Package, Hash, Trash2 } from "lucide-react";
import type { Product } from "../types/api";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import React from "react";

interface ProductCardProps {
  product: Product | any; // Allow for other product-like structures
  onAddToCart?: (message: string) => void; // Function to handle "add to cart" messages
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Format price to 2 decimal places with $ symbol
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price || 0);

  // Check if this is a cart item with quantity
  const hasQuantity =
    typeof product.quantity === "number" && product.quantity > 0;

  // Handle add to cart click
  const handleAddToCart = () => {
    if (onAddToCart && product.id) {
      onAddToCart(`Add item with ID: ${product.id} to cart`);
    }
  };

  // Handle remove from cart click
  const handleRemoveFromCart = () => {
    if (onAddToCart && product.id) {
      onAddToCart(`Remove item with ID: ${product.id} from cart`);
    }
  };

  return (
    <Card className="h-full overflow-hidden transition-all hover:shadow-md group">
      {/* Product Image with hover zoom effect */}
      <div className="relative aspect-square overflow-hidden bg-secondary/10 p-4">
        <img
          src={product.image || "https://placehold.co/400x400?text=No+Image"}
          alt={product.title || "Product"}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {/* Price tag */}
        <div className="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
          {formattedPrice}
        </div>

        {/* Quantity badge for cart items */}
        {hasQuantity && (
          <div className="absolute left-2 top-2 rounded-full bg-secondary px-2 py-1 text-xs font-semibold shadow-sm flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Qty: {product.quantity}</span>
          </div>
        )}

        {/* Product ID badge */}
        <div className="absolute left-2 bottom-2 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground shadow-sm flex items-center gap-1">
          <Hash className="h-3 w-3" />
          <span>ID: {product.id || "N/A"}</span>
        </div>
      </div>

      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="line-clamp-2 text-sm font-medium flex-1">
            {product.title || "Untitled Product"}
          </h3>
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground min-h-[32px]">
          {product.description || "No description available"}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {product.category || "Uncategorized"}
          </Badge>

          {/* Only show rating if it exists */}
          {product.rating && (
            <div className="flex items-center text-xs text-muted-foreground ml-auto">
              <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {product.rating.rate ? product.rating.rate.toFixed(1) : "N/A"}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">
                ({product.rating.count || 0})
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0">
        {hasQuantity ? (
          <Button
            size="sm"
            className="w-full gap-2 text-xs"
            variant="destructive"
            onClick={handleRemoveFromCart}
          >
            <Trash2 className="h-3 w-3" />
            Remove from Cart
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3 w-3" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
