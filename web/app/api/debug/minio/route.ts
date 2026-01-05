import { NextResponse } from "next/server";
import { s3Client } from "@/lib/s3/client";
import { ListBucketsCommand } from "@aws-sdk/client-s3";

export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    try {
        const result = await s3Client.send(new ListBucketsCommand({}));
        let endpoint: unknown = s3Client.config.endpoint;
        if (typeof endpoint === "function") {
            endpoint = await (endpoint as () => Promise<unknown>)();
        }
        return NextResponse.json({
            status: "success",
            buckets: result.Buckets,
            endpoint: endpoint ?? null
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            message: error.message,
            code: error.Code,
            name: error.name
        }, { status: 500 });
    }
}
