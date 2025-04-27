import React, { useState } from "react";
import JSZip from "jszip";
import {
  Container,
  Form,
  Button,
  Spinner,
  Row,
  Col,
  Card,
} from "react-bootstrap";

const Mini: React.FC = () => {
  const [webpUrls, setWebpUrls] = useState<{ name: string; url: string }[]>([]);
  const [maxWidth, setMaxWidth] = useState<number>(800);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [fileCount, setFileCount] = useState<number>(0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setFileCount(files.length);
    setLoading(true);
    const promises = Array.from(files).map((file) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (event) => {
          if (typeof event.target?.result === "string") {
            img.src = event.target.result;
          }
        };

        img.onload = () => {
          let { width, height } = img;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const newUrl = URL.createObjectURL(blob);
                  const newName = file.name.replace(
                    /\.(jpg|jpeg|png)$/i,
                    ".webp"
                  );
                  setWebpUrls((prev) => [
                    ...prev,
                    { name: newName, url: newUrl },
                  ]);
                }
                resolve();
              },
              "image/webp",
              0.8
            );
          } else {
            resolve();
          }
        };

        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(() => setLoading(false));
  };

  const downloadAll = async () => {
    setZipping(true);
    const zip = new JSZip();

    for (const { name, url } of webpUrls) {
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = "images.zip";
    a.click();
    setZipping(false);
  };

  return (
    <Container className="py-5 min-vh-100 d-flex flex-column align-items-center">
      <Card className="p-4 shadow rounded w-100" style={{ maxWidth: "600px" }}>
        <h1 className="text-center mb-4">Image to WEBP Converter</h1>

        <Form.Group className="mb-3">
          <Form.Label>Max Width (px)</Form.Label>
          <Form.Control
            type="number"
            value={maxWidth}
            onChange={(e) => setMaxWidth(Number(e.target.value))}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Control
            type="file"
            accept="image/png, image/jpeg"
            multiple
            onChange={handleImageUpload}
          />
          {fileCount > 0 && (
            <small className="text-muted">Počet souborů: {fileCount}</small>
          )}
        </Form.Group>

        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Processing images...</p>
          </div>
        )}
      </Card>

      {webpUrls.length > 0 && (
        <Card
          className="p-4 shadow rounded w-100 mt-4"
          style={{ maxWidth: "900px" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Converted WEBP Images:</h4>
            <Button variant="success" onClick={downloadAll} disabled={zipping}>
              {zipping ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />{" "}
                  Creating ZIP...
                </>
              ) : (
                "Download All as ZIP"
              )}
            </Button>
          </div>

          <Row>
            {webpUrls.map(({ name, url }, index) => (
              <Col md={4} sm={6} xs={12} key={index} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img variant="top" src={url} />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="text-truncate mb-2" title={name}>
                      {name}
                    </Card.Title>
                    <Button variant="primary" href={url} className="mt-auto">
                      Download
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </Container>
  );
};

export default Mini;
