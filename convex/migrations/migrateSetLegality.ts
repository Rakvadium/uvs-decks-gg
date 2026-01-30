import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const migrateSetLegality = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const sets = await ctx.db.query("sets").collect();
    
    let updated = 0;
    let skipped = 0;
    
    for (const set of sets) {
      const legality = set.legality as unknown;
      
      if (legality === undefined || legality === null) {
        skipped++;
        continue;
      }
      
      if (typeof legality === "string") {
        if (legality.includes(" ") && !legality.includes("|")) {
          const formats = legality.split(/\s+/).filter(f => f.length > 0);
          const legalityString = formats.join("|");
          await ctx.db.patch(set._id, {
            legality: legalityString,
          });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }
      
      if (typeof legality === "object" && legality !== null) {
        const allFormats: string[] = [];
        
        for (const [formatKey, isLegal] of Object.entries(legality as Record<string, boolean>)) {
          if (isLegal) {
            if (formatKey.includes(" ")) {
              const splitFormats = formatKey.split(/\s+/).filter(f => f.length > 0);
              allFormats.push(...splitFormats);
            } else {
              allFormats.push(formatKey);
            }
          }
        }
        
        const uniqueFormats = [...new Set(allFormats)];
        const legalityString = uniqueFormats.join("|");
        
        await ctx.db.patch(set._id, {
          legality: legalityString || undefined,
        });
        
        updated++;
      } else {
        skipped++;
      }
    }
    
    return { updated, skipped };
  },
});
