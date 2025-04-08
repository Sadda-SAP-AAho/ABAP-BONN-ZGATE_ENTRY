@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'CDS for Calculation GRN QTY'
@Metadata.ignorePropagatedAnnotations: true
@ObjectModel.usageType:{
    serviceQuality: #X,
    sizeCategory: #S,
    dataClass: #MIXED
}
define view entity ZI_GRNQTY as 
select from I_MaterialDocumentItem_2 as GRN
join I_PurchaseOrderItemAPI01 as PurchaseItem on PurchaseItem.PurchaseOrder = GRN.PurchaseOrder and PurchaseItem.PurchaseOrderItem =  GRN.PurchaseOrderItem 
{
    @Semantics.quantity.unitOfMeasure: 'MaterialBaseUnit'
    cast(sum(GRN.QuantityInBaseUnit) as abap.dec(15,2)) as GRNQty,
    cast(GRN.PurchaseOrder as abap.char(15)) as PurchaseOrder,
    concat('0',GRN.PurchaseOrderItem) as PurchaseOrderItem,
    GRN.MaterialBaseUnit
}
where GRN.GoodsMovementIsCancelled = '' and GRN.GoodsMovementType = '101'
group by GRN.PurchaseOrder, GRN.PurchaseOrderItem, GRN.MaterialBaseUnit

union 
select from ZR_GateEntryLines as GateEntryLines
join ZR_GateEntryHeader as EntryHeader on GateEntryLines.GateEntryNo = EntryHeader.GateEntryNo
{
    sum(GateEntryLines.GateQty) as GRNQty,
    GateEntryLines.DocumentNo as PurchaseOrder,
    GateEntryLines.DocumentItemNo as PurchaseOrderItem,
    GateEntryLines.UOM as MaterialBaseUnit
}
where EntryHeader.EntryType = 'RGP-OUT'
group by GateEntryLines.DocumentNo, GateEntryLines.DocumentItemNo, GateEntryLines.UOM 

union
 select from ZR_GateEntryLines as GateEntryLines
 join ZR_GateEntryHeader as EntryHeader on GateEntryLines.DocumentNo = EntryHeader.GateEntryNo
 {
     sum(GateEntryLines.InQty) as GRNQty,
    GateEntryLines.DocumentNo as PurchaseOrder,
    GateEntryLines.DocumentItemNo as PurchaseOrderItem,
    GateEntryLines.UOM as MaterialBaseUnit
 }
 where EntryHeader.EntryType = 'RGP-OUT'
 group by GateEntryLines.DocumentNo, GateEntryLines.DocumentItemNo, GateEntryLines.UOM 
 
;
