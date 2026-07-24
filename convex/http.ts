import { httpRouter } from "convex/server";
import { auth } from "./auth";
import {
  createDrafts,
  draftUploadUrl,
  linkCardFaces,
  rebuildCatalogAggregates,
  upsertCardsBatch,
  upsertSet,
} from "./adminHttp";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: "/admin/upsert-set", method: "POST", handler: upsertSet });
http.route({
  path: "/admin/upsert-cards-batch",
  method: "POST",
  handler: upsertCardsBatch,
});
http.route({
  path: "/admin/link-card-faces",
  method: "POST",
  handler: linkCardFaces,
});
http.route({
  path: "/admin/draft-upload-url",
  method: "POST",
  handler: draftUploadUrl,
});
http.route({
  path: "/admin/create-drafts",
  method: "POST",
  handler: createDrafts,
});
http.route({
  path: "/admin/rebuild-catalog-aggregates",
  method: "POST",
  handler: rebuildCatalogAggregates,
});

export default http;
