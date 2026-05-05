import { describe, expect, test } from "bun:test";
import {
  ALL_TEAM_CAPABILITIES,
  hasCapability,
  TEAM_ROLES,
  type TeamCapability,
  type TeamRole,
} from "../convex/teams/permissions";

const SPEC_MATRIX: Record<
  TeamRole,
  Record<TeamCapability, boolean>
> = {
  captain: {
    view_team: true,
    view_team_decks: true,
    view_team_stats: true,
    create_team_deck: true,
    share_team_deck: true,
    post_team_chat: true,
    post_team_announcements: true,
    pin_team_announcements: true,
    moderate_team_chat: true,
    manage_team_events: true,
    invite_members: true,
    manage_members: true,
    assign_roles: true,
    remove_members: true,
    edit_team_settings: true,
    transfer_captaincy: true,
    delete_team: true,
  },
  co_captain: {
    view_team: true,
    view_team_decks: true,
    view_team_stats: true,
    create_team_deck: true,
    share_team_deck: true,
    post_team_chat: true,
    post_team_announcements: true,
    pin_team_announcements: true,
    moderate_team_chat: true,
    manage_team_events: true,
    invite_members: true,
    manage_members: true,
    assign_roles: true,
    remove_members: true,
    edit_team_settings: false,
    transfer_captaincy: false,
    delete_team: false,
  },
  architect: {
    view_team: true,
    view_team_decks: true,
    view_team_stats: true,
    create_team_deck: true,
    share_team_deck: true,
    post_team_chat: true,
    post_team_announcements: true,
    pin_team_announcements: false,
    moderate_team_chat: false,
    manage_team_events: false,
    invite_members: false,
    manage_members: false,
    assign_roles: false,
    remove_members: false,
    edit_team_settings: false,
    transfer_captaincy: false,
    delete_team: false,
  },
  analyst: {
    view_team: true,
    view_team_decks: true,
    view_team_stats: true,
    create_team_deck: true,
    share_team_deck: true,
    post_team_chat: true,
    post_team_announcements: true,
    pin_team_announcements: false,
    moderate_team_chat: false,
    manage_team_events: false,
    invite_members: false,
    manage_members: false,
    assign_roles: false,
    remove_members: false,
    edit_team_settings: false,
    transfer_captaincy: false,
    delete_team: false,
  },
  scout: {
    view_team: true,
    view_team_decks: true,
    view_team_stats: true,
    create_team_deck: true,
    share_team_deck: true,
    post_team_chat: true,
    post_team_announcements: true,
    pin_team_announcements: false,
    moderate_team_chat: false,
    manage_team_events: false,
    invite_members: false,
    manage_members: false,
    assign_roles: false,
    remove_members: false,
    edit_team_settings: false,
    transfer_captaincy: false,
    delete_team: false,
  },
  pilot: {
    view_team: true,
    view_team_decks: true,
    view_team_stats: true,
    create_team_deck: true,
    share_team_deck: true,
    post_team_chat: true,
    post_team_announcements: true,
    pin_team_announcements: false,
    moderate_team_chat: false,
    manage_team_events: false,
    invite_members: false,
    manage_members: false,
    assign_roles: false,
    remove_members: false,
    edit_team_settings: false,
    transfer_captaincy: false,
    delete_team: false,
  },
};

describe("teams permissions matrix (docs/teams-feature-implementation.md §4.2)", () => {
  test("every role is listed in the spec table", () => {
    expect(new Set(TEAM_ROLES).size).toBe(6);
  });

  test("every capability in ALL_TEAM_CAPABILITIES appears in SPEC_MATRIX for each role", () => {
    for (const role of TEAM_ROLES) {
      for (const cap of ALL_TEAM_CAPABILITIES) {
        expect(SPEC_MATRIX[role]).toHaveProperty(cap);
      }
    }
  });

  test("hasCapability matches §4.2 matrix", () => {
    for (const role of TEAM_ROLES) {
      for (const cap of ALL_TEAM_CAPABILITIES) {
        expect(hasCapability(role, cap)).toBe(SPEC_MATRIX[role][cap]);
      }
    }
  });
});
