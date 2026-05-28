import { UserOptions } from "jspdf-autotable";
import jsPDF from "jspdf";

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
    autoTable: (options: UserOptions) => jsPDF;
  }
}
