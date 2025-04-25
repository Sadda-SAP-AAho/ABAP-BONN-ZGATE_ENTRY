import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Button from "sap/m/Button";
import Select from "sap/m/Select";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import PDFViewer from "sap/m/PDFViewer";
import MessageToast from "sap/m/MessageToast";
import SmartTable from "sap/ui/comp/smarttable/SmartTable";

/**
 * @namespace gateentry.controller
 */
export default class Grid extends Controller {

    public oDataModel: ODataModel;
    public _PDFViewer: PDFViewer;
    public selectedDoc: string;

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        var oModel = new ODataModel("/sap/opu/odata/sap/ZUI_GATEENTRY/");
        this.getView()?.setModel(oModel);

        var oToday = new Date();
        var oModel2 = new JSONModel();
        oModel2.setData({
            currentDate: oToday
        });
        this.byId("_IDGenSelectOption")?.setModel(oModel2);

        this.EntryTypeSelect();

        (this.byId("_IDGenSmartTable") as SmartTable).rebindTable(true)
    }

    public EntryTypeSelect(): void {
        let oSelect = this.byId("_IDGenSelect1") as Select;
        if (!oSelect) return
        oSelect.setColumnRatio("25:60");
    }


    public gateOut(): void {
        let sPath = this.selectedDoc;
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GateEntryOut", {
            GateEntry: window.encodeURIComponent(sPath)
        });
    }

    public onSelectionChange(oEvent: any) {
        let object = oEvent.getParameters().listItem.getBindingContext().getObject();
        if(object.GateOutDate !== '' && object.GateOutDate !== null){
            this.selectedDoc =  "";
        (this.byId("_IDGenButton8") as Button).setEnabled(false);
            return;
        }
        this.selectedDoc =  object.GateEntryNo;
        (this.byId("_IDGenButton8") as Button).setEnabled(true);
    }


    public navigate(oEvt: any): void {
        let sPath = oEvt.getSource().getBindingContext().sPath;
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GateEntryDetails", {
            GateEntry: window.encodeURIComponent(sPath)
        });
    }


    public onBeforeRebindTable(e: any): void {
        var b = e.getParameter("bindingParams");
        let Entrytype = (this.byId("_IDGenSelect1") as any).getSelectedItem()?.getText();
        var aDateFilters = []

        aDateFilters.push(new Filter("EntryType", FilterOperator.EQ, Entrytype))
        aDateFilters.push(new Filter("GateOutward", FilterOperator.EQ, "0"))
        if (!aDateFilters.length) return
        var oOwnMultiFilter = new Filter(aDateFilters, true);

        if (b.filters[0] && b.filters[0].aFilters) {
            var oSmartTableMultiFilter = b.filters[0];
            b.filters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
        } else {
            b.filters.push(oOwnMultiFilter);
        }

        if( Entrytype === 'RGP-IN' ){
            (this.byId("_IDGenButton01") as Button).setEnabled(true);
            (this.byId("_IDGenButton02") as Button).setEnabled(false);
            (this.byId("_IDGenButton03") as Button).setEnabled(false);
            (this.byId("_IDGenButton04") as Button).setEnabled(false);
            (this.byId("_IDGenButton05") as Button).setEnabled(false);
        } 
      
        if( Entrytype === 'RGP-OUT' ){
            (this.byId("_IDGenButton02") as Button).setEnabled(true);
            (this.byId("_IDGenButton01") as Button).setEnabled(false);
            (this.byId("_IDGenButton03") as Button).setEnabled(false);
            (this.byId("_IDGenButton04") as Button).setEnabled(false);
            (this.byId("_IDGenButton05") as Button).setEnabled(false);
        } 

        if( Entrytype === 'NRGP' ){
            (this.byId("_IDGenButton03") as Button).setEnabled(true);
            (this.byId("_IDGenButton02") as Button).setEnabled(false);
            (this.byId("_IDGenButton01") as Button).setEnabled(false);
            (this.byId("_IDGenButton04") as Button).setEnabled(false);
            (this.byId("_IDGenButton05") as Button).setEnabled(false);
        } 

        if( Entrytype === 'PUR' ){
            (this.byId("_IDGenButton05") as Button).setEnabled(true);
            (this.byId("_IDGenButton02") as Button).setEnabled(false);
            (this.byId("_IDGenButton01") as Button).setEnabled(false);
            (this.byId("_IDGenButton03") as Button).setEnabled(false);
            (this.byId("_IDGenButton04") as Button).setEnabled(false);
        } 
        if( Entrytype === 'WREF' ){
            (this.byId("_IDGenButton04") as Button).setEnabled(true);
            (this.byId("_IDGenButton02") as Button).setEnabled(false);
            (this.byId("_IDGenButton01") as Button).setEnabled(false);
            (this.byId("_IDGenButton05") as Button).setEnabled(false);
            (this.byId("_IDGenButton03") as Button).setEnabled(false);
        } 

    }

    public onClickCreate(): void {
        const router = (this.getOwnerComponent() as any).getRouter();
        router.navTo("GateEntryCreate");
    }

    public onClickRGPIN(): void {
           var that = this;
           BusyIndicator.show();
           console.log(this.selectedDoc) ;
           if (!this.selectedDoc) {
               MessageToast.show("Select a Document")
               BusyIndicator.hide();
           } else {
               let formData = new FormData();
               formData.append("lv_gateentry", this.selectedDoc)
               $.ajax({
                   url: "/sap/bc/http/sap/ZRGP_IN_HTTP",
                   method: "POST",
                   data: formData,
                   processData: false,
                   contentType: false,
                   success: function (result: any) {
    
                       if (result.includes("Accounting")) {
                           MessageToast.show(result);
                           BusyIndicator.hide();
                           return;
                       }
    
                       var decodedPdfContent = atob(result);
                       var byteArray = new Uint8Array(decodedPdfContent.length);
                       for (var i = 0; i < decodedPdfContent.length; i++) {
                           byteArray[i] = decodedPdfContent.charCodeAt(i);
                       }
                       var blob = new Blob([byteArray.buffer], {
                           type: 'application/pdf'
                       });
                       var _pdfurl = URL.createObjectURL(blob);
    
                       if (!that._PDFViewer) {
                           that._PDFViewer = new PDFViewer({
                               width: "auto",
                               source: _pdfurl
                           });
                       }
                       else {
                           that._PDFViewer = new PDFViewer({
                               width: "auto",
                               source: _pdfurl
                           });
    
                       }
                       BusyIndicator.hide()
                       that._PDFViewer.open();
    
                   }
               });
            }
        }

        public onClickRGPOUT(): void {
            
               var that = this;
               BusyIndicator.show();
               console.log(this.selectedDoc) ;
               if (!this.selectedDoc) {
                   MessageToast.show("Select a Document")
                   BusyIndicator.hide();
               } else {
                   let formData = new FormData();
                   formData.append("lv_gateentry", this.selectedDoc)
                //    formData.append("lv_gateentry",this.selectedCompany)
                   $.ajax({
                       url: "/sap/bc/http/sap/ZRGP_OUT_HTTP",
                       method: "POST",
                       data: formData,
                       processData: false,
                       contentType: false,
                       success: function (result: any) {
        
                           if (result.includes("Accounting")) {
                               MessageToast.show(result);
                               BusyIndicator.hide();
                               return;
                           }
        
                           var decodedPdfContent = atob(result);
                           var byteArray = new Uint8Array(decodedPdfContent.length);
                           for (var i = 0; i < decodedPdfContent.length; i++) {
                               byteArray[i] = decodedPdfContent.charCodeAt(i);
                           }
                           var blob = new Blob([byteArray.buffer], {
                               type: 'application/pdf'
                           });
                           var _pdfurl = URL.createObjectURL(blob);
        
                           if (!that._PDFViewer) {
                               that._PDFViewer = new PDFViewer({
                                   width: "auto",
                                   source: _pdfurl
                               });
                           }
                           else {
                               that._PDFViewer = new PDFViewer({
                                   width: "auto",
                                   source: _pdfurl
                               });
        
                           }
                           BusyIndicator.hide()
                           that._PDFViewer.open();
        
                       }
                   });
                }
            }

            public onClickNRGP(): void {
            
                var that = this;
                BusyIndicator.show();
                console.log(this.selectedDoc) ;
                if (!this.selectedDoc) {
                    MessageToast.show("Select a Document")
                    BusyIndicator.hide();
                } else {
                    let formData = new FormData();
                    formData.append("lv_gateentry", this.selectedDoc)
                 //    formData.append("lv_gateentry",this.selectedCompany)
                    $.ajax({
                        url: "/sap/bc/http/sap/ZNRGP_HTTP",
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result: any) {
         
                            if (result.includes("Accounting")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
         
                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);
         
                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
         
                            }
                            BusyIndicator.hide()
                            that._PDFViewer.open();
         
                        }
                    });
                 }
             }
             
             public onClickGatepassPurchase(): void {
            
                var that = this;
                BusyIndicator.show();
                console.log(this.selectedDoc) ;
                if (!this.selectedDoc) {
                    MessageToast.show("Select a Document")
                    BusyIndicator.hide();
                } else {
                    let formData = new FormData();
                    formData.append("lv_gateentry", this.selectedDoc)
                 //    formData.append("lv_gateentry",this.selectedCompany)
                    $.ajax({
                        url: "/sap/bc/http/sap/ZGATEPASS_PURCHASE_HTTP",
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result: any) {
         
                            if (result.includes("Accounting")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
         
                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);
         
                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
         
                            }
                            BusyIndicator.hide()
                            that._PDFViewer.open();
         
                        }
                    });
                 }
             }

             public onClickGAtepassInward(): void {
            
                var that = this;
                BusyIndicator.show();
                console.log(this.selectedDoc) ;
                if (!this.selectedDoc) {
                    MessageToast.show("Select a Document")
                    BusyIndicator.hide();
                } else {
                    let formData = new FormData();
                    formData.append("lv_gateentry", this.selectedDoc)
                 //    formData.append("lv_gateentry",this.selectedCompany)
                    $.ajax({
                        url: "/sap/bc/http/sap/ZGATEPASS_INWARD_HTTP",
                        method: "POST",
                        data: formData,
                        processData: false,
                        contentType: false,
                        success: function (result: any) {
         
                            if (result.includes("Accounting")) {
                                MessageToast.show(result);
                                BusyIndicator.hide();
                                return;
                            }
         
                            var decodedPdfContent = atob(result);
                            var byteArray = new Uint8Array(decodedPdfContent.length);
                            for (var i = 0; i < decodedPdfContent.length; i++) {
                                byteArray[i] = decodedPdfContent.charCodeAt(i);
                            }
                            var blob = new Blob([byteArray.buffer], {
                                type: 'application/pdf'
                            });
                            var _pdfurl = URL.createObjectURL(blob);
         
                            if (!that._PDFViewer) {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
                            }
                            else {
                                that._PDFViewer = new PDFViewer({
                                    width: "auto",
                                    source: _pdfurl
                                });
         
                            }
                            BusyIndicator.hide()
                            that._PDFViewer.open();
         
                        }
                    });
                 }
                }

}
