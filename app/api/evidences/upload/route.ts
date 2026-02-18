import { createHash } from 'crypto';
import { withAuth } from '@/lib/api/middleware';
import { createdResponse, badRequestResponse, handleRouteError, errorResponse } from '@/lib/api/response';
import { createEvidence } from '@/lib/evidences/service';
import { getCaseById } from '@/lib/cases/service';
import { notifyEvidenceUploaded } from '@/lib/notifications/service';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const POST = withAuth(async (request, { user, teamId }) => {
  try {
    const formData = await request.formData();

    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return badRequestResponse('A file is required');
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequestResponse('File size must be less than 25MB');
    }

    const caseId = parseInt(formData.get('caseId') as string);
    const caseFormId = parseInt(formData.get('caseFormId') as string);
    const fieldPath = (formData.get('fieldPath') as string) || undefined;

    if (!caseId || isNaN(caseId)) {
      return badRequestResponse('caseId is required');
    }
    if (!caseFormId || isNaN(caseFormId)) {
      return badRequestResponse('caseFormId is required');
    }

    // Upload to Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return errorResponse('Cloudinary is not configured', 500);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'case-evidences';
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(signatureString).digest('hex');

    const uploadForm = new FormData();
    uploadForm.append('file', new Blob([buffer], { type: file.type || 'application/octet-stream' }), file.name);
    uploadForm.append('api_key', apiKey);
    uploadForm.append('timestamp', timestamp.toString());
    uploadForm.append('signature', signature);
    uploadForm.append('folder', folder);

    // Use /auto/upload to support all file types (images, PDFs, docs, etc.)
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: uploadForm }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Cloudinary upload failed:', errText);
      return errorResponse('File upload failed', 500);
    }

    const uploadJson = await uploadRes.json();
    const secureUrl = uploadJson.secure_url as string | undefined;

    if (!secureUrl) {
      return errorResponse('File upload failed', 500);
    }

    // Determine file type from extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const evidence = await createEvidence(
      {
        caseId,
        caseFormId,
        fieldPath,
        fileName: file.name,
        fileType: ext,
        fileSize: file.size,
        fileUrl: secureUrl,
      },
      teamId,
      user.id
    );

    // Notify team about new evidence (fire-and-forget)
    getCaseById(caseId, teamId).then(caseData => {
      if (caseData) {
        notifyEvidenceUploaded(teamId, caseId, caseData.caseNumber || String(caseId), file.name, user.name || user.email)
          .catch(err => console.error('Failed to notify evidence uploaded:', err));
      }
    }).catch(err => console.error('Failed to look up case for evidence notification:', err));

    return createdResponse(evidence);
  } catch (error) {
    return handleRouteError(error, 'Failed to upload evidence');
  }
});
