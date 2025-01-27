fitsfile *openFITSFile(char *ifile, int iomode, char *extlist, int *hdutype,
		       int *status);

fitsfile *openFITSMem(void **buf, size_t *buflen, char *extlist, 
		      int *hdutype, int *status);

fitsfile *flipImage(fitsfile *fptr, char *flip, int *status);

fitsfile *filterTableToImage(fitsfile *fptr, char *filter, char **cols,
			     int *dims, double *cens, int bin, int *status);

int *getImageToArray(fitsfile *fptr, int *dims, double *cens,
		     int bin, int binMode, char *slice,
		     int *start, int *stop, int *bitpix, int *status);

void getHeaderToString(fitsfile *fptr, char **cardstr, int *ncard, int *status);


void updateWCS(fitsfile *fptr, fitsfile *ofptr,
	       int xcen, int ycen, int dim1, int dim2, int bin,
	       float *amin);

void closeFITSFile(fitsfile *fptr, int *status);
