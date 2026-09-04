/**
 * Utilidades de compresión de imágenes, recorte interactivo y video para Zodia
 * Formato Estándar: Portrait 3:4 (Proporcional a 3072 x 4080)
 */

/**
 * Recorta y exporta una imagen a formato WebP en alta definición
 * @param {Object} options
 * @param {HTMLImageElement} options.img Elemento de imagen cargado
 * @param {Object} options.crop Coordenadas de recorte { x, y, width, height } en píxeles naturales
 * @param {number} [options.rotation=0] Grados de rotación (0, 90, 180, 270)
 * @param {number} [options.targetWidth=1536] Ancho estándar destino (3:4 = 1536x2048)
 * @param {number} [options.targetHeight=2048] Alto estándar destino
 * @param {number} [options.quality=0.88] Calidad de compresión WebP (0 a 1)
 * @param {string} [options.fileName='foto'] Nombre base para el archivo
 * @returns {Promise<{ blob: Blob, file: File, previewUrl: string, width: number, height: number, size: number }>}
 */
export async function cropAndExportImage({
  img,
  crop,
  rotation = 0,
  targetWidth = 1536,
  targetHeight = 2048,
  quality = 0.88,
  fileName = 'foto_zodia'
}) {
  return new Promise((resolve, reject) => {
    try {
      // 1. Canvas intermedio para manejar la rotación si existe
      let sourceCanvas = document.createElement('canvas');
      let sWidth = img.naturalWidth || img.width;
      let sHeight = img.naturalHeight || img.height;

      const normRotation = ((rotation % 360) + 360) % 360;
      const isRotated90or270 = normRotation === 90 || normRotation === 270;

      if (isRotated90or270) {
        sourceCanvas.width = sHeight;
        sourceCanvas.height = sWidth;
      } else {
        sourceCanvas.width = sWidth;
        sourceCanvas.height = sHeight;
      }

      const sCtx = sourceCanvas.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';

      sCtx.save();
      sCtx.translate(sourceCanvas.width / 2, sourceCanvas.height / 2);
      sCtx.rotate((normRotation * Math.PI) / 180);
      sCtx.drawImage(img, -sWidth / 2, -sHeight / 2);
      sCtx.restore();

      // 2. Canvas final con la resolución objetivo estándar (Portrait 3:4 o Square 1:1)
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const fCtx = finalCanvas.getContext('2d');

      fCtx.imageSmoothingEnabled = true;
      fCtx.imageSmoothingQuality = 'high';

      // Coordenadas de recorte dentro del sourceCanvas
      const cropX = Math.max(0, Math.min(crop.x, sourceCanvas.width));
      const cropY = Math.max(0, Math.min(crop.y, sourceCanvas.height));
      const cropW = Math.min(crop.width, sourceCanvas.width - cropX);
      const cropH = Math.min(crop.height, sourceCanvas.height - cropY);

      fCtx.drawImage(
        sourceCanvas,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        targetWidth,
        targetHeight
      );

      // 3. Exportar a WebP de alta fidelidad
      finalCanvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback a JPEG si WebP no responde
            finalCanvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob) return reject(new Error('Error al generar imagen recortada.'));
                finish(jpegBlob, 'image/jpeg', 'jpg');
              },
              'image/jpeg',
              quality
            );
            return;
          }
          finish(blob, 'image/webp', 'webp');
        },
        'image/webp',
        quality
      );

      function finish(resBlob, mimeType, ext) {
        const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const finalFile = new File([resBlob], `${cleanName}_${Date.now()}.${ext}`, { type: mimeType });
        const previewUrl = URL.createObjectURL(resBlob);

        resolve({
          blob: resBlob,
          file: finalFile,
          previewUrl,
          width: targetWidth,
          height: targetHeight,
          size: resBlob.size
        });
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Comprime una imagen a formato WebP manteniendo excelente nitidez visual
 */
export async function compressImage(file, maxDimension = 1536, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no soportado.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) return reject(new Error('Error al comprimir imagen.'));
                  finish(jpegBlob, 'image/jpeg', 'jpg');
                },
                'image/jpeg',
                quality
              );
              return;
            }
            finish(blob, 'image/webp', 'webp');
          },
          'image/webp',
          quality
        );

        function finish(resultBlob, type, ext) {
          const newFileName = (file.name || 'foto').replace(/\.[^/.]+$/, '') + `.${ext}`;
          const compressedFile = new File([resultBlob], newFileName, { type });
          const previewUrl = URL.createObjectURL(resultBlob);

          resolve({
            blob: resultBlob,
            file: compressedFile,
            previewUrl,
            originalSize: file.size,
            compressedSize: resultBlob.size,
            width,
            height
          });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Recorta y optimiza un video para una ventana de tiempo específica (5.0 segundos)
 * @param {File|Blob} file Archivo de video original
 * @param {number} [startTime=0] Segundo inicial para el recorte
 * @param {number} [duration=5.0] Duración del fragmento (default 5.0 segundos)
 * @param {function} [onProgress=()=>{}] Callback con porcentaje 0..100
 */
export async function trimAndOptimizeVideo(file, startTime = 0, duration = 5.0, onProgress = () => {}) {
  // Manejo de compatibilidad con la firma antigua: trimAndOptimizeVideo(file, maxDuration, onProgress)
  let actualStart = 0;
  let actualDuration = 5.0;
  let actualProgress = onProgress;

  if (typeof startTime === 'number' && typeof duration === 'function') {
    // Firma anterior: (file, maxDuration, onProgress)
    actualStart = 0;
    actualDuration = startTime;
    actualProgress = duration;
  } else {
    actualStart = typeof startTime === 'number' ? Math.max(0, startTime) : 0;
    actualDuration = typeof duration === 'number' ? Math.min(duration, 5.0) : 5.0;
  }

  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('No se pudo procesar el video. Verifica que sea un formato válido (MP4, WebM o MOV).'));
    };

    video.onloadedmetadata = async () => {
      const originalDuration = video.duration;
      const safeStart = Math.min(actualStart, Math.max(0, originalDuration - 1));
      const targetDuration = Math.min(actualDuration, originalDuration - safeStart);
      const wasTrimmed = originalDuration > targetDuration + 0.2;

      // Fallback si MediaRecorder no existe
      if (typeof window === 'undefined' || !window.MediaRecorder) {
        URL.revokeObjectURL(videoUrl);
        return resolve({
          blob: file,
          file,
          previewUrl: URL.createObjectURL(file),
          duration: originalDuration,
          wasTrimmed: false
        });
      }

      // Dimensiones proporcionales Portrait 3:4 o 9:16
      let width = video.videoWidth || 720;
      let height = video.videoHeight || 1280;

      const maxDim = 1080;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      const canvasStream = canvas.captureStream(30);

      try {
        if (typeof video.captureStream === 'function') {
          const vStream = video.captureStream();
          const audioTracks = vStream.getAudioTracks();
          if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      } catch {}

      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
        }
      }

      const chunks = [];
      let recorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 2800000 })
          : new MediaRecorder(canvasStream);
      } catch {
        URL.revokeObjectURL(videoUrl);
        return resolve({
          blob: file,
          file,
          previewUrl: URL.createObjectURL(file),
          duration: originalDuration,
          wasTrimmed: false
        });
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const ext = recorder.mimeType && recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const finalFile = new File([finalBlob], `mini_video_${Date.now()}.${ext}`, { type: finalBlob.type });
        const previewUrl = URL.createObjectURL(finalBlob);

        URL.revokeObjectURL(videoUrl);
        resolve({
          blob: finalBlob,
          file: finalFile,
          previewUrl,
          duration: targetDuration,
          wasTrimmed
        });
      };

      video.currentTime = safeStart;

      video.onseeked = () => {
        video.onseeked = null;
        let animId;
        const recordStartTime = performance.now();

        const drawLoop = () => {
          if (video.paused || video.ended) return;

          ctx.drawImage(video, 0, 0, width, height);
          const elapsed = (performance.now() - recordStartTime) / 1000;
          const pct = Math.min(100, Math.round((elapsed / targetDuration) * 100));
          actualProgress(pct);

          if (elapsed >= targetDuration || video.currentTime >= safeStart + targetDuration) {
            video.pause();
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
            cancelAnimationFrame(animId);
            return;
          }

          animId = requestAnimationFrame(drawLoop);
        };

        recorder.start(100);
        video
          .play()
          .then(() => {
            drawLoop();
          })
          .catch(() => {
            recorder.stop();
            URL.revokeObjectURL(videoUrl);
            resolve({
              blob: file,
              file,
              previewUrl: URL.createObjectURL(file),
              duration: targetDuration,
              wasTrimmed: false
            });
          });
      };
    };
  });
}
