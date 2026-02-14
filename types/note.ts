export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteInsert = {
  title: string;
  content?: string | null;
};

export type NoteUpdate = {
  title?: string;
  content?: string | null;
};
