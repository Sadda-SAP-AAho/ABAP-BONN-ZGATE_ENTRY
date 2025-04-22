@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Value Help to Get Details in Lines'
@Metadata.ignorePropagatedAnnotations: true
@ObjectModel.usageType:{
    serviceQuality: #X,
    sizeCategory: #S,
    dataClass: #MIXED
}
define view entity ZI_DocumentVH as 
select from I_PurchaseOrderAPI01 as PUR
    join I_PurchaseOrderItemAPI01 as PurchaseOrderItem       on  PUR.PurchaseOrder = PurchaseOrderItem.PurchaseOrder
    left outer join ZREMQTY_CALC as _GRN       on  _GRN.PurchaseOrder = PUR.PurchaseOrder 
    and _GRN.PurchaseOrderItem  = concat('0',PurchaseOrderItem.PurchaseOrderItem) 
    left outer join ZR_TAXCODE as TaxCode on TaxCode.Taxcode = PurchaseOrderItem.TaxCode

    { 
       key cast(PUR.PurchaseOrder as abap.char(15))     as                  DocumentNo,
       key cast('PUR'        as abap.char(10))          as                  EntryType,
       key concat('0',PurchaseOrderItem.PurchaseOrderItem)          as                  DocumentItemNo,      
        PurchaseOrderItem.Material                      as                  DocumentItem,
        PurchaseOrderItem.PurchaseOrderItemText         as                  DocumentItemText,
        PUR.PurchaseOrderDate                           as                  DocumentDate,
        cast(PUR.PurchaseOrderType as abap.char(10))    as                  DocumentType,
        PUR.Supplier                                    as                  InvoicingParty,
        cast(PUR._Supplier.SupplierName as abap.char(81))                     as                  InvoicingPartyName,
        PUR._Supplier.BusinessPartnerPanNumber          as                  InvoicingPartyPAN,        
        PUR.CompanyCode                                 as                  CompanyCode,
        PurchaseOrderItem.Plant                         as                  Plant,
//        PurchaseOrderItem.StorageLocation               as                  StorageLocation,
        TaxCode.Rate                                    as                  GST,
       
        @Semantics.quantity.unitOfMeasure: 'DocumentItemQtyUnit'
        cast(PurchaseOrderItem.OrderQuantity as abap.dec(15,2))                 as                  DocumentItemQty,
        @Semantics.amount.currencyCode: 'DocumentCurrency'  
        PurchaseOrderItem.NetAmount                     as                  DocumentItemPrice,
        PurchaseOrderItem.DocumentCurrency              as                  DocumentCurrency,
        @Semantics.amount.currencyCode: 'DocumentCurrency'  
        cast(PurchaseOrderItem.NetPriceAmount  as abap.curr(13,2))                 as                  Rate,
        PurchaseOrderItem.PurchaseOrderQuantityUnit     as                  DocumentItemQtyUnit,
        @Semantics.quantity.unitOfMeasure: 'DocumentItemQtyUnit'     
        cast(case when _GRN.GRNQty is null then PurchaseOrderItem.OrderQuantity
        else (PurchaseOrderItem.OrderQuantity - _GRN.GRNQty)  end as abap.dec(15,2))  as         BalQty,
//        Tolerance Qty
        cast(
            PurchaseOrderItem.OrderQuantity * PurchaseOrderItem.OverdelivTolrtdLmtRatioInPct / 100
            as abap.dec(15,2))                          as                  ToleranceQty
    }
    where PurchaseOrderItem.PurchasingDocumentDeletionCode = '' and PurchaseOrderItem.IsCompletelyDelivered = ''
          and PUR.ReleaseIsNotCompleted = '' and PUR.PurchaseOrderType != 'ZSRV' and PUR.PurchaseOrderType != 'ZRET' 
          
    union
     select from ZR_GateEntryHeader as EntryHeader
    join ZR_GateEntryLines as EntryLines on EntryLines.GateEntryNo = EntryHeader.GateEntryNo
     left outer join ZREMQTY_CALC as _GRN       on  _GRN.PurchaseOrder = EntryHeader.GateEntryNo  
     and _GRN.PurchaseOrderItem  = EntryLines.GateItemNo
    {
        key EntryHeader.GateEntryNo                     as                  DocumentNo,
        key 'RGP-IN'                                    as                  EntryType,
        key EntryLines.GateItemNo                       as                  DocumentItemNo,
        EntryLines.ProductCode                          as                  DocumentItem,
        EntryLines.ProductDesc                          as                  DocumentItemText,
        EntryHeader.EntryDate                           as                  DocumentDate,  
        'RGP-OUT'                                       as                  DocumentType,                
        EntryLines.PartyCode                            as                  InvoicingParty,
        EntryLines.PartyName                            as                  InvoicingPartyName,
        ''                                              as                  InvoicingPartyPAN,
        ''                                              as                  CompanyCode,
        EntryLines.Plant                                as                  Plant,
//        EntryLines.SLoc                                 as                  StorageLocation,
        EntryLines.GST                                  as                  GST,
        
        EntryLines.GateQty                              as                  DocumentItemQty,
        cast(EntryLines.GateValue as abap.curr(13,2))   as                  DocumentItemPrice,
        cast('INRAB' as abap.cuky)                      as                  DocumentCurrency,
        cast(EntryLines.Rate as abap.curr(13,2))        as                  Rate,
        EntryLines.UOM                                  as                  DocumentItemQtyUnit,
        cast(
           ( case 
               when _GRN.GRNQty is null then cast( EntryLines.GateQty as abap.dec(15,3) )
               else cast( EntryLines.GateQty as abap.dec(15,3) ) - cast( _GRN.GRNQty as abap.dec(15,3) )
             end
           ) as abap.dec(13,3)
        )                                               as                  BalQty,
       0                                                as                  ToleranceQty              
    }
     where EntryHeader.GateOutward = 0 and EntryHeader.EntryType = 'RGP-OUT'
     union
     select from I_PurchaseOrderAPI01 as PUR
    join I_PurchaseOrderItemAPI01 as PurchaseOrderItem       on  PUR.PurchaseOrder = PurchaseOrderItem.PurchaseOrder
    left outer join ZREMQTY_CALC as _GRN       on  PUR.PurchaseOrder = _GRN.PurchaseOrder and _GRN.PurchaseOrderItem = concat('0',PurchaseOrderItem.PurchaseOrderItem )
    left outer join ZR_TAXCODE as TaxCode on TaxCode.Taxcode = PurchaseOrderItem.TaxCode

    {
       key cast(PUR.PurchaseOrder as abap.char(15))     as                  DocumentNo,
       key cast('RGP-OUT' as abap.char(10))             as                  EntryType,
       key concat('0',PurchaseOrderItem.PurchaseOrderItem)          as                  DocumentItemNo,
        PurchaseOrderItem.Material                      as                  DocumentItem,
        PurchaseOrderItem.PurchaseOrderItemText         as                  DocumentItemText,
        PUR.PurchaseOrderDate                           as                  DocumentDate,
        cast(PUR.PurchaseOrderType as abap.char(10))    as                  DocumentType,
        PUR.Supplier                                    as                  InvoicingParty,
        PUR._Supplier.SupplierName                      as                  InvoicingPartyName,
        PUR._Supplier.BusinessPartnerPanNumber          as                  InvoicingPartyPAN,               
        PUR.CompanyCode                                 as                  CompanyCode,
        PurchaseOrderItem.Plant                         as                  Plant,
//        PurchaseOrderItem.StorageLocation               as                  StorageLocation,
        TaxCode.Rate                                    as                  GST,
       
        PurchaseOrderItem.OrderQuantity                 as                  DocumentItemQty,
        PurchaseOrderItem.NetAmount                     as                  DocumentItemPrice,
        PurchaseOrderItem.DocumentCurrency              as                  DocumentCurrency,
        PurchaseOrderItem.NetPriceAmount                as                  Rate,
        PurchaseOrderItem.PurchaseOrderQuantityUnit     as                  DocumentItemQtyUnit,      
        cast(case when _GRN.GRNQty is null then PurchaseOrderItem.OrderQuantity
        else (PurchaseOrderItem.OrderQuantity - _GRN.GRNQty) end as abap.dec(15,2))  as       BalQty,
        cast(
            PurchaseOrderItem.OrderQuantity * PurchaseOrderItem.OverdelivTolrtdLmtRatioInPct / 100
            as abap.dec(15,2))                          as                  ToleranceQty
    }
    where PurchaseOrderItem.PurchasingDocumentDeletionCode = '' and PurchaseOrderItem.IsCompletelyDelivered = ''
          and PUR.ReleaseIsNotCompleted = ''  and PUR.PurchaseOrderType = 'ZSRV'
     
          ;
