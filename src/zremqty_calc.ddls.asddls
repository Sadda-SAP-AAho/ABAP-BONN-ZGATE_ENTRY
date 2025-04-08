@AbapCatalog.viewEnhancementCategory: [#NONE]
@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Calculate for Remaining Quantity'
@Metadata.ignorePropagatedAnnotations: true
@ObjectModel.usageType:{
    serviceQuality: #X,
    sizeCategory: #S,
    dataClass: #MIXED
}
define view entity ZREMQTY_CALC as select from ZI_GRNQTY
{
    @Semantics.quantity.unitOfMeasure: 'MaterialBaseUnit'
    sum(GRNQty) as GRNQty,
    PurchaseOrder,
    PurchaseOrderItem,
    MaterialBaseUnit
}
group by  PurchaseOrder,
    PurchaseOrderItem,
    MaterialBaseUnit
