/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTPPasswordReset from "../ResendOTPPasswordReset.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as cards from "../cards.js";
import type * as collections from "../collections.js";
import type * as deckValidation from "../deckValidation.js";
import type * as decks from "../decks.js";
import type * as errors from "../errors.js";
import type * as flags from "../flags.js";
import type * as formats from "../formats.js";
import type * as http from "../http.js";
import type * as migrations_migrateDeckSchema from "../migrations/migrateDeckSchema.js";
import type * as migrations_migrateSetLegality from "../migrations/migrateSetLegality.js";
import type * as r2 from "../r2.js";
import type * as sessions from "../sessions.js";
import type * as sets from "../sets.js";
import type * as social from "../social.js";
import type * as tierLists from "../tierLists.js";
import type * as user from "../user.js";
import type * as utils_filtering from "../utils/filtering.js";
import type * as utils_validation from "../utils/validation.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTPPasswordReset: typeof ResendOTPPasswordReset;
  admin: typeof admin;
  auth: typeof auth;
  cards: typeof cards;
  collections: typeof collections;
  deckValidation: typeof deckValidation;
  decks: typeof decks;
  errors: typeof errors;
  flags: typeof flags;
  formats: typeof formats;
  http: typeof http;
  "migrations/migrateDeckSchema": typeof migrations_migrateDeckSchema;
  "migrations/migrateSetLegality": typeof migrations_migrateSetLegality;
  r2: typeof r2;
  sessions: typeof sessions;
  sets: typeof sets;
  social: typeof social;
  tierLists: typeof tierLists;
  user: typeof user;
  "utils/filtering": typeof utils_filtering;
  "utils/validation": typeof utils_validation;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  r2: {
    lib: {
      deleteMetadata: FunctionReference<
        "mutation",
        "internal",
        { bucket: string; key: string },
        null
      >;
      deleteObject: FunctionReference<
        "mutation",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        null
      >;
      deleteR2Object: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        null
      >;
      getMetadata: FunctionReference<
        "query",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        {
          bucket: string;
          bucketLink: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
          url: string;
        } | null
      >;
      listMetadata: FunctionReference<
        "query",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          cursor?: string;
          endpoint: string;
          limit?: number;
          secretAccessKey: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            bucket: string;
            bucketLink: string;
            contentType?: string;
            key: string;
            lastModified: string;
            link: string;
            sha256?: string;
            size?: number;
            url: string;
          }>;
          pageStatus?: null | "SplitRecommended" | "SplitRequired";
          splitCursor?: null | string;
        }
      >;
      store: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          secretAccessKey: string;
          url: string;
        },
        any
      >;
      syncMetadata: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          onComplete?: string;
          secretAccessKey: string;
        },
        null
      >;
      upsertMetadata: FunctionReference<
        "mutation",
        "internal",
        {
          bucket: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
        },
        { isNew: boolean }
      >;
    };
  };
};
