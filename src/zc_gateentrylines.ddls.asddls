@AccessControl.authorizationCheck: #NOT_REQUIRED
@Metadata.allowExtensions: true
@EndUserText.label: 'Gate Entry Lines Projection View'
@ObjectModel.semanticKey: [ 'GateItemNo' ]
@Search.searchable: true
define view entity ZC_GateEntryLines 
  as projection on ZR_GateEntryLines as GateEntryLines
{

    @Search.defaultSearchElement: true
    @Search.fuzzinessThreshold: 0.90 
    key GateEntryNo,
    @Search.defaultSearchElement: true
    @Search.fuzzinessThreshold: 0.90 
    key GateItemNo,
    Plant,
    SLoc,
    ProductCode,
    ProductDesc,
    UOM,
    PartyCode,
    PartyName,
    DocumentQty,
    GateQty,
    InQty,
    GST,
    OrderQty,
    BalQty,
    Tolerance,
    GateValue,
    Rate,
    DocumentNo,
    DocumentItemNo,
    Remarks,
    /* Associations */
    _GateEntryHeader : redirected to parent ZC_GateEntryHeader
}
