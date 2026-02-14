import { supabase } from "@/lib/supabase";
import type { Note, NoteInsert, NoteUpdate } from "@/types/note";

const TABLE = "notes";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error("You must be signed in to access notes.");
  }
  return data.user;
}

export async function fetchNotes() {
  const user = await requireUser();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return (data ?? []) as Note[];
}

export async function createNote(input: NoteInsert) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      title: input.title,
      content: input.content ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data as Note;
}

export async function updateNote(id: string, input: NoteUpdate) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      title: input.title,
      content: input.content ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    throw new Error(getErrorMessage(error));
  }
}
