

# Upload the files to Amazon S3 using a foreach loop
foreach ($f in "subfile1.bin", "subfile1.bin") {
Write-S3Object -BucketName website-example -File $f -Key $f -CannedACLName public-read
}