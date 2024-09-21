import { Readable } from "stream";
import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

interface BounceInfo {
  bounceType: string;
  bouncedEmail: string;
}

export class EmailProcessor {
  private imap: Imap;

  constructor(config: Imap.Config) {
    this.imap = new Imap({
      ...config,
      tlsOptions: {
        rejectUnauthorized: false, // This ignores SSL certificate errors
        // Alternatively, you can provide the correct certificate:
        // ca: [fs.readFileSync('path/to/certificate.pem')]
      },
    });
  }

  async processEmails(): Promise<BounceInfo[]> {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        this.imap.openBox("INBOX", false, (err, box) => {
          if (err) reject(err);
          const fetchStream = this.imap.seq.fetch("1:*", {
            bodies: ["HEADER", "TEXT"],
          });

          const bounces: BounceInfo[] = [];

          fetchStream.on("message", (msg) => {
            msg.on("body", (stream, info) => {
              // Cast the stream to Readable
              simpleParser(
                stream as Readable,
                async (err, parsed: ParsedMail) => {
                  if (err) console.error(err);
                  if (parsed.from?.text.includes("Mail Delivery Subsystem")) {
                    const bounceInfo = this.extractBounceInfo(parsed.text);
                    if (bounceInfo) bounces.push(bounceInfo);
                  }
                }
              );
            });
          });

          fetchStream.once("error", (err) => {
            reject(err);
          });

          fetchStream.once("end", () => {
            this.imap.end();
            resolve(bounces);
          });
        });
      });

      this.imap.once("error", (err: any) => {
        reject(err);
      });

      this.imap.connect();
    });
  }

  private extractBounceInfo(text: string | undefined): BounceInfo | null {
    if (!text) return null;
    const addressMatch = text.match(
      /Your message wasn't delivered to ([\w.-]+@[\w.-]+)/
    );
    if (addressMatch) {
      return {
        bounceType: "Address not found",
        bouncedEmail: addressMatch[1],
      };
    }
    return null;
  }
}
