param (
    [string]$PrinterName = "Barcode Printer",
    [string]$ImagePath = "",
    [int]$Copies = 1
)

if (-not $ImagePath -or -not (Test-Path $ImagePath)) {
    Write-Error "Image file not found: $ImagePath"
    exit 1
}

$typeDefinition = @"
using System;
using System.Drawing;
using System.Drawing.Printing;

public class ImagePrinter {
    private string printerName;
    private string imagePath;
    private int copies;

    public ImagePrinter(string printerName, string imagePath, int copies) {
        this.printerName = printerName;
        this.imagePath = imagePath;
        this.copies = copies;
    }

    public void Print() {
        PrintDocument pd = new PrintDocument();
        pd.PrinterSettings.PrinterName = this.printerName;
        pd.PrinterSettings.Copies = (short)this.copies;
        pd.PrintPage += new PrintPageEventHandler(pd_PrintPage);
        pd.Print();
    }

    private void pd_PrintPage(object sender, PrintPageEventArgs ev) {
        using (Image img = Image.FromFile(this.imagePath)) {
            // Draw image to fit the visible area of the printer page
            ev.Graphics.DrawImage(img, ev.Graphics.VisibleClipBounds);
        }
    }
}
"@

try {
    Add-Type -TypeDefinition $typeDefinition -ReferencedAssemblies "System.Drawing" -ErrorAction SilentlyContinue
} catch {}

# Print the image
$printer = New-Object ImagePrinter($PrinterName, $ImagePath, $Copies)
$printer.Print()
