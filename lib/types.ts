export interface Note {
  id: string;
  title: string;
  source: "youtube" | "local";
  url: string | null;
  original_path: string | null;
  status: "queued" | "processing" | "done" | "error";
  language: string | null;
  duration: string | null;
  created_at: string;
  summary: string | null;
  tags: string[];
  progress: number;
  current_step: string | null;
  error_msg: string | null;
  whisper_model: string;
  frame_interval: number;
  hash_threshold: number;
  skip_classify: boolean;
  output_dir: string | null;
  html_path: string | null;
}

export interface Section {
  id: number;
  note_id: string;
  position: number;
  title: string;
  content: string;
  takeaways: string[];
  images: SectionImage[];
}

export interface SectionImage {
  id: number;
  section_id: number;
  position: number;
  file_path: string;
  caption: string | null;
}

export interface TranscriptSegment {
  id: number;
  note_id: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface NoteDetail extends Note {
  sections: Section[];
  transcript: TranscriptSegment[];
}

export interface NoteStats {
  total: number;
  done: number;
  processing: number;
  queued: number;
  totalSections: number;
  totalImages: number;
}

export interface CreateNoteParams {
  url?: string;
  filePath?: string;
  whisperModel?: string;
  frameInterval?: number;
  hashThreshold?: number;
  skipClassify?: boolean;
}
