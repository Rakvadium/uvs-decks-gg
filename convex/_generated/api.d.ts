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
import type * as accountStatusExpiry from "../accountStatusExpiry.js";
import type * as admin from "../admin.js";
import type * as adminUsers from "../adminUsers.js";
import type * as auth from "../auth.js";
import type * as cardFacets from "../cardFacets.js";
import type * as cards from "../cards.js";
import type * as collections from "../collections.js";
import type * as communityRankings from "../communityRankings.js";
import type * as communityYoutube from "../communityYoutube.js";
import type * as crons from "../crons.js";
import type * as deckShares from "../deckShares.js";
import type * as deckValidation from "../deckValidation.js";
import type * as decks from "../decks.js";
import type * as errors from "../errors.js";
import type * as feedback from "../feedback.js";
import type * as flags from "../flags.js";
import type * as formats from "../formats.js";
import type * as http from "../http.js";
import type * as lib_accountStatus from "../lib/accountStatus.js";
import type * as lib_appearanceMigration from "../lib/appearanceMigration.js";
import type * as lib_deckAccess from "../lib/deckAccess.js";
import type * as lib_moderation_localCommentHeuristic from "../lib/moderation/localCommentHeuristic.js";
import type * as lib_moderation_providers from "../lib/moderation/providers.js";
import type * as lib_moderation_textPublish from "../lib/moderation/textPublish.js";
import type * as mediaAssetActions from "../mediaAssetActions.js";
import type * as mediaAssets from "../mediaAssets.js";
import type * as migrations_migrateDeckSchema from "../migrations/migrateDeckSchema.js";
import type * as migrations_migrateDeckTeamFields from "../migrations/migrateDeckTeamFields.js";
import type * as migrations_migrateDeckVisibility from "../migrations/migrateDeckVisibility.js";
import type * as migrations_migrateSetLegality from "../migrations/migrateSetLegality.js";
import type * as migrations_migrateTeamsCore from "../migrations/migrateTeamsCore.js";
import type * as publishTeamChatMessage from "../publishTeamChatMessage.js";
import type * as publishTierListComment from "../publishTierListComment.js";
import type * as r2 from "../r2.js";
import type * as sessions from "../sessions.js";
import type * as setCardCountSync from "../setCardCountSync.js";
import type * as sets from "../sets.js";
import type * as social from "../social.js";
import type * as teamChatInsertInternal from "../teamChatInsertInternal.js";
import type * as teams_announcements from "../teams/announcements.js";
import type * as teams_chat from "../teams/chat.js";
import type * as teams_deckCollaboration from "../teams/deckCollaboration.js";
import type * as teams_events from "../teams/events.js";
import type * as teams_hub from "../teams/hub.js";
import type * as teams_invites from "../teams/invites.js";
import type * as teams_logo from "../teams/logo.js";
import type * as teams_members from "../teams/members.js";
import type * as teams_permissions from "../teams/permissions.js";
import type * as teams_teamDecks from "../teams/teamDecks.js";
import type * as textModeration from "../textModeration.js";
import type * as tierListCommentInternal from "../tierListCommentInternal.js";
import type * as tierLists from "../tierLists.js";
import type * as user from "../user.js";
import type * as userStatusInternal from "../userStatusInternal.js";
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
  accountStatusExpiry: typeof accountStatusExpiry;
  admin: typeof admin;
  adminUsers: typeof adminUsers;
  auth: typeof auth;
  cardFacets: typeof cardFacets;
  cards: typeof cards;
  collections: typeof collections;
  communityRankings: typeof communityRankings;
  communityYoutube: typeof communityYoutube;
  crons: typeof crons;
  deckShares: typeof deckShares;
  deckValidation: typeof deckValidation;
  decks: typeof decks;
  errors: typeof errors;
  feedback: typeof feedback;
  flags: typeof flags;
  formats: typeof formats;
  http: typeof http;
  "lib/accountStatus": typeof lib_accountStatus;
  "lib/appearanceMigration": typeof lib_appearanceMigration;
  "lib/deckAccess": typeof lib_deckAccess;
  "lib/moderation/localCommentHeuristic": typeof lib_moderation_localCommentHeuristic;
  "lib/moderation/providers": typeof lib_moderation_providers;
  "lib/moderation/textPublish": typeof lib_moderation_textPublish;
  mediaAssetActions: typeof mediaAssetActions;
  mediaAssets: typeof mediaAssets;
  "migrations/migrateDeckSchema": typeof migrations_migrateDeckSchema;
  "migrations/migrateDeckTeamFields": typeof migrations_migrateDeckTeamFields;
  "migrations/migrateDeckVisibility": typeof migrations_migrateDeckVisibility;
  "migrations/migrateSetLegality": typeof migrations_migrateSetLegality;
  "migrations/migrateTeamsCore": typeof migrations_migrateTeamsCore;
  publishTeamChatMessage: typeof publishTeamChatMessage;
  publishTierListComment: typeof publishTierListComment;
  r2: typeof r2;
  sessions: typeof sessions;
  setCardCountSync: typeof setCardCountSync;
  sets: typeof sets;
  social: typeof social;
  teamChatInsertInternal: typeof teamChatInsertInternal;
  "teams/announcements": typeof teams_announcements;
  "teams/chat": typeof teams_chat;
  "teams/deckCollaboration": typeof teams_deckCollaboration;
  "teams/events": typeof teams_events;
  "teams/hub": typeof teams_hub;
  "teams/invites": typeof teams_invites;
  "teams/logo": typeof teams_logo;
  "teams/members": typeof teams_members;
  "teams/permissions": typeof teams_permissions;
  "teams/teamDecks": typeof teams_teamDecks;
  textModeration: typeof textModeration;
  tierListCommentInternal: typeof tierListCommentInternal;
  tierLists: typeof tierLists;
  user: typeof user;
  userStatusInternal: typeof userStatusInternal;
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
