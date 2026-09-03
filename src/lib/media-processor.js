/**
 * Utilidades de compresión de imágenes y recorte de video para Zodia
 */

/**
 * Comprime una imagen a formato WebP manteniendo excelente nitidez visual
 * @param {File|Blob} file 
 * @param {number} maxDimension Resolución máxima (ancho o alto)
 * @param {number} quality Calidad WebP (0 a 1)
 * @returns {Promise<{ blob: Blob, file: File, previewUrl: string, originalSize: number, compressedSize: number }>}
 */
export async function compressImage(file, maxDimension = 1280, quality = 0.82) {
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

        // Renderizar con suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP (o JPEG si no es compatible)
        const mimeType = 'image/webp';
        canvas.toBlob((blob) => {
          if (!blob) {
            // Fallback a jpeg
            canvas.toBlob((jpegBlob) => {
              if (!jpegBlob) return reject(new Error('Error al comprimir imagen.'));
              finish(jpegBlob, 'image/jpeg', 'jpg');
            }, 'image/jpeg', quality);
            return;
          }
          finish(blob, 'image/webp', 'webp');
        }, mimeType, quality);

        function finish(resultBlob, type, ext) {
          const newFileName = (file.name || 'foto').replace(/\.[^/.]+$/, "") + `.${ext}`;
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
 * Recorta y optimiza un video para que no supere 5.0 segundos
 * @param {File|Blob} file 
 * @param {number} maxDuration Duración máxima en segundos (default: 5.0)
 * @param {function} onProgress Callback de progreso (0 a 100)
 * @returns {Promise<{ blob: Blob, file: File, previewUrl: string, duration: number, wasTrimmed: boolean }>}
 */
export async function trimAndOptimizeVideo(file, maxDuration = 5.0, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('No se pudo cargar el archivo de video. Verifica que sea un formato válido (MP4, WebM o MOV).'));
    };

    video.onloadedmetadata = async () => {
      const originalDuration = video.duration;
      const targetDuration = Math.min(originalDuration, maxDuration);
      const wasTrimmed = originalDuration > maxDuration + 0.1;

      // Si el navegador no soporta MediaRecorder o CanvasStream, devolver el archivo si ya es <= 5s
      if (typeof window === 'undefined' || !window.MediaRecorder) {
        URL.revokeObjectURL(videoUrl);
        if (originalDuration > maxDuration + 0.5) {
          return reject(new Error(`El video dura ${originalDuration.toFixed(1)}s. El máximo permitido es ${maxDuration}s.`));
        }
        return resolve({
          blob: file,
          file,
          previewUrl: URL.createObjectURL(file),
          duration: originalDuration,
          wasTrimmed: false
        });
      }

      // Preparar canvas para capturar exactamente los primeros 5 segundos a 30fps
      let width = video.videoWidth || 720;
      let height = video.videoHeight || 1280;

      // Escalar resolución si es demasiado grande para móvil (máx 720p ancho o 1280 alto)
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

      // Asegurar que las dimensiones sean pares
      width = width % 2 === 0 ? width : width - 1;
      height = height % 2 === 0 ? height : height - 1;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      // Obtener stream del canvas a 30 FPS
      const canvasStream = canvas.captureStream(30);

      // Intentar agregar la pista de audio si existe
      try {
        if (typeof video.captureStream === 'function') {
          const videoStream = video.captureStream();
          const audioTracks = videoStream.getAudioTracks();
          if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      } catch {}

      // Elegir códec soportado
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      const chunks = [];
      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 2500000 }) : new MediaRecorder(canvasStream);
      } catch (recErr) {
        // Si falla MediaRecorder, usar archivo original si <= 5s
        URL.revokeObjectURL(videoUrl);
        if (originalDuration > maxDuration + 0.5) {
          return reject(new Error(`El video dura ${originalDuration.toFixed(1)}s. El máximo permitido es ${maxDuration}s.`));
        }
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
        const ext = recorder.mimeType.includes('mp4') ? 'mp4' : 'webm';
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

      let animationFrameId;
      const startTime = performance.now();

      const drawLoop = () => {
        if (video.paused || video.ended) return;

        ctx.drawImage(video, 0, 0, width, height);
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(100, Math.round((elapsed / targetDuration) * 100));
        onProgress(progress);

        if (elapsed >= targetDuration || video.currentTime >= targetDuration) {
          video.pause();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          cancelAnimationFrame(animationFrameId);
          return;
        }

        animationFrameId = requestAnimationFrame(drawLoop);
      };

      recorder.start(100);
      video.currentTime = 0;
      
      video.play()
        .then(() => {
          drawLoop();
        })
        .catch(() => {
          // Fallback en caso de autoplay bloqueado
          recorder.stop();
          URL.revokeObjectURL(videoUrl);
          resolve({
            blob: file,
            file,
            previewUrl: URL.createObjectURL(file),
            duration: Math.min(originalDuration, maxDuration),
            wasTrimmed: false
          });
        });
    };
  });
}
