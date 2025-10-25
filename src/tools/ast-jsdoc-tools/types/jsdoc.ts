export interface JsDocTag {
  name: string;
  value: string;
  optional?: boolean;
}

export interface JsDocSuggestion {
  targetId: string;
  summary: string;
  description?: string;
  tags: JsDocTag[];
  needsReview: boolean;
  existingDoc?: string;
  suggestedDoc: string;
}
