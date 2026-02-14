import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 },
      );
    }

    if (!category || !["transit", "heat", "safety"].includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing category" },
        { status: 400 },
      );
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    // Store in categorized folder: [category]/[uuid].[ext]
    const filePath = `${category}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("report-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to upload to storage" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("report-images").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
