/**
 * Practical food-based suggestions for calorie adjustments
 */

export interface CalorieSuggestion {
  food: string;
  amount: string;
  calories: number;
  description?: string;
}

export function getCalorieSuggestions(targetChange: number): CalorieSuggestion[] {
  const suggestions: CalorieSuggestion[] = [];
  const absChange = Math.abs(targetChange);

  if (targetChange > 0) {
    // Need to increase calories
    if (absChange >= 200) {
      suggestions.push(
        { food: 'Extra Virgin Olive Oil', amount: '1 tablespoon', calories: 120, description: 'Add to salads, vegetables, or meals' },
        { food: 'Almonds', amount: '1/4 cup (30g)', calories: 170, description: 'Great snack or add to meals' },
        { food: 'Peanut Butter', amount: '1 tablespoon', calories: 95, description: 'On toast, in smoothies, or with fruit' },
        { food: 'Avocado', amount: '1/2 medium', calories: 120, description: 'Add to salads, toast, or meals' },
        { food: 'Whole Milk', amount: '1 cup (240ml)', calories: 150, description: 'Instead of water or in smoothies' },
        { food: 'Greek Yogurt (full fat)', amount: '1/2 cup', calories: 100, description: 'High protein, great for snacks' },
        { food: 'Dark Chocolate (70%+)', amount: '30g (2 squares)', calories: 150, description: 'Quality calories with antioxidants' },
        { food: 'Coconut Oil', amount: '1 tablespoon', calories: 120, description: 'For cooking or in coffee' },
        { food: 'Cheese (cheddar)', amount: '30g (1 oz)', calories: 115, description: 'Add to meals or as snack' },
        { food: 'Oats', amount: '1/2 cup dry', calories: 150, description: 'Great for breakfast or snacks' }
      );
    } else if (absChange >= 150) {
      suggestions.push(
        { food: 'Extra Virgin Olive Oil', amount: '1 tablespoon', calories: 120 },
        { food: 'Almonds', amount: '1/4 cup', calories: 170 },
        { food: 'Peanut Butter', amount: '1 tablespoon', calories: 95 },
        { food: 'Avocado', amount: '1/2 medium', calories: 120 },
        { food: 'Whole Milk', amount: '1 cup', calories: 150 }
      );
    } else if (absChange >= 100) {
      suggestions.push(
        { food: 'Extra Virgin Olive Oil', amount: '1 tablespoon', calories: 120 },
        { food: 'Almonds', amount: '15g (small handful)', calories: 85 },
        { food: 'Peanut Butter', amount: '1 tablespoon', calories: 95 },
        { food: 'Avocado', amount: '1/4 medium', calories: 60 }
      );
    } else {
      suggestions.push(
        { food: 'Extra Virgin Olive Oil', amount: '1/2 tablespoon', calories: 60 },
        { food: 'Almonds', amount: '10g', calories: 55 },
        { food: 'Peanut Butter', amount: '1/2 tablespoon', calories: 48 }
      );
    }
  } else if (targetChange < 0) {
    // Need to decrease calories
    if (absChange >= 200) {
      suggestions.push(
        { food: 'Reduce cooking oil', amount: '1 tablespoon less', calories: -120, description: 'Use cooking spray or less oil' },
        { food: 'Skip added fats', amount: 'Butter/oil in meals', calories: -100, description: 'Cook with less added fat' },
        { food: 'Reduce portion size', amount: '15-20% smaller', calories: -150, description: 'Slightly smaller portions' },
        { food: 'Choose leaner protein', amount: 'Chicken breast vs thigh', calories: -80, description: 'Swap for leaner cuts' },
        { food: 'Reduce snacks', amount: 'Skip 1 snack', calories: -150, description: 'Eliminate one snack per day' }
      );
    } else if (absChange >= 150) {
      suggestions.push(
        { food: 'Reduce cooking oil', amount: '1 tablespoon less', calories: -120 },
        { food: 'Skip added fats', amount: 'Butter/oil reduction', calories: -100 },
        { food: 'Reduce portion size', amount: '10-15% smaller', calories: -120 }
      );
    } else if (absChange >= 100) {
      suggestions.push(
        { food: 'Reduce cooking oil', amount: '1/2 tablespoon less', calories: -60 },
        { food: 'Skip one snack', amount: 'Eliminate 1 snack', calories: -100 },
        { food: 'Reduce portion size', amount: '10% smaller', calories: -80 }
      );
    } else {
      suggestions.push(
        { food: 'Reduce cooking oil', amount: 'Slightly less', calories: -40 },
        { food: 'Smaller portions', amount: '5-10% reduction', calories: -50 }
      );
    }
  }

  // Select suggestions that add up close to target
  const selected: CalorieSuggestion[] = [];
  let currentTotal = 0;
  const target = absChange;

  for (const suggestion of suggestions) {
    if (currentTotal + Math.abs(suggestion.calories) <= target + 50) {
      selected.push(suggestion);
      currentTotal += Math.abs(suggestion.calories);
      if (currentTotal >= target - 20) break;
    }
  }

  // If we're still short, add one more item
  if (currentTotal < target - 30 && suggestions.length > selected.length) {
    const remaining = suggestions.find(s => 
      !selected.includes(s) && 
      currentTotal + Math.abs(s.calories) <= target + 30
    );
    if (remaining) selected.push(remaining);
  }

  return selected.length > 0 ? selected : suggestions.slice(0, 3);
}

/**
 * Format suggestions as readable text
 */
export function formatCalorieSuggestions(targetChange: number): string[] {
  const suggestions = getCalorieSuggestions(targetChange);
  return suggestions.map(s => {
    const sign = s.calories > 0 ? '+' : '';
    const base = `${sign}${s.calories} kcal: ${s.amount} ${s.food}`;
    return s.description ? `${base} (${s.description})` : base;
  });
}